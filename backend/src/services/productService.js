import shopify from '../lib/shopify.js';

const BATCH_SIZE = 50;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function handleRateLimit(error, retryCount = 0) {
  if (retryCount >= MAX_RETRIES) {
    throw new Error('Rate limit exceeded after multiple retries');
  }

  const retryAfter = error.headers?.['retry-after'] || error.retryAfter;
  if (retryAfter) {
    const delay = parseInt(retryAfter) * 1000;
    console.log(`Rate limited. Waiting ${delay}ms before retry ${retryCount + 1}`);
    await sleep(delay);
    return true;
  }

  const delay = RETRY_DELAY * Math.pow(2, retryCount);
  await sleep(delay);
  return true;
}

async function buildProductQuery(filters) {
  let query = '';
  const variables = {};

  if (filters.keyword) {
    query += 'title:*' + filters.keyword + '*';
  }

  if (filters.productType) {
    if (query) query += ' AND ';
    query += 'product_type:' + filters.productType;
  }

  if (filters.collectionHandle) {
    if (query) query += ' AND ';
    query += 'collection:' + filters.collectionHandle;
  } else if (filters.collectionId) {
    if (query) query += ' AND ';
    query += 'collection_id:' + filters.collectionId;
  }

  return query || '*';
}

async function fetchProductsWithPagination(session, filters, limit = 250) {
  const allProducts = [];
  let cursor = null;
  let hasNextPage = true;
  const query = await buildProductQuery(filters);

  while (hasNextPage && allProducts.length < limit) {
    let retryCount = 0;
    let success = false;

    while (!success && retryCount < MAX_RETRIES) {
      try {
        const client = new shopify.clients.Graphql({ session, apiVersion: shopify.config.apiVersion });
        const graphqlQuery = `
          query getProducts($query: String!, $first: Int!, $after: String) {
            products(first: $first, query: $query, after: $after) {
              pageInfo {
                hasNextPage
                endCursor
              }
              edges {
                node {
                  id
                  title
                  handle
                  productType
                  tags
                  status
                }
              }
            }
          }
        `;

        const variables = {
          query,
          first: Math.min(250, limit - allProducts.length),
          after: cursor,
        };

        const response = await client.query({
          data: { query: graphqlQuery, variables },
        });
        const products = response.body?.data?.products;

        if (products?.edges) {
          const productNodes = products.edges.map(edge => ({
            id: edge.node.id.split('/').pop(),
            title: edge.node.title,
            handle: edge.node.handle,
            productType: edge.node.productType,
            tags: edge.node.tags || [],
            status: edge.node.status,
          }));

          allProducts.push(...productNodes);
          hasNextPage = products.pageInfo.hasNextPage;
          cursor = products.pageInfo.endCursor;
        } else {
          hasNextPage = false;
        }

        success = true;
      } catch (error) {
        if (error.code === 'THROTTLED' || error.status === 429) {
          await handleRateLimit(error, retryCount);
          retryCount++;
        } else {
          throw error;
        }
      }
    }

    if (!success) {
      throw new Error('Failed to fetch products after retries');
    }
  }

  return allProducts;
}

async function updateProductTags(session, productId, tagsToAdd) {
  const client = new shopify.clients.Graphql({ session, apiVersion: shopify.config.apiVersion });

  const mutation = `
    mutation productUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product {
          id
          tags
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await client.query({
    data: {
      query: mutation,
      variables: {
        input: {
          id: `gid://shopify/Product/${productId}`,
          tags: tagsToAdd,
        },
      },
    },
  });

  if (response.body?.data?.productUpdate?.userErrors?.length > 0) {
    throw new Error(response.body.data.productUpdate.userErrors[0].message);
  }

  return response.body?.data?.productUpdate?.product;
}

export async function getFilteredProducts(session, filters, pageSize = 250) {
  try {
    const products = await fetchProductsWithPagination(session, filters, pageSize);
    return {
      products,
      total: products.length,
      hasMore: products.length >= pageSize,
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

export async function previewProducts(session, filters) {
  try {
    const previewLimit = 10;
    const products = await fetchProductsWithPagination(session, filters, previewLimit);

    const preview = products.slice(0, previewLimit).map(p => ({
      id: p.id,
      title: p.title,
    }));

    const totalCount = products.length;

    return {
      total: totalCount,
      preview,
      hasMore: products.length >= previewLimit,
    };
  } catch (error) {
    console.error('Error previewing products:', error);
    throw error;
  }
}

export async function bulkTagProducts(session, filters, tagToAdd) {
  const results = {
    updated: 0,
    alreadyHadTag: 0,
    failed: 0,
    errors: [],
  };

  try {
    const products = await fetchProductsWithPagination(session, filters, 10000);

    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);

      for (const product of batch) {
        try {
          const currentTags = product.tags || [];
          const hasTag = currentTags.includes(tagToAdd);

          if (hasTag) {
            results.alreadyHadTag++;
            continue;
          }

          const newTags = [...currentTags, tagToAdd];
          await updateProductTags(session, product.id, newTags);
          results.updated++;

          if (i % 10 === 0) {
            await sleep(100);
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            productId: product.id,
            title: product.title,
            error: error.message,
          });
          console.error(`Failed to tag product ${product.id}:`, error.message);
        }
      }

      if (i + BATCH_SIZE < products.length) {
        await sleep(500);
      }
    }

    return results;
  } catch (error) {
    console.error('Error in bulk tagging:', error);
    throw error;
  }
}

