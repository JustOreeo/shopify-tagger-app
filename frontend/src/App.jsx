import { AppProvider as PolarisAppProvider } from '@shopify/polaris'
import '@shopify/polaris/build/esm/styles.css'
import './App.css'

function App() {
  return (
    <PolarisAppProvider
      i18n={{
        Polaris: {
          Avatar: {
            label: 'Avatar',
            labelWithInitials: 'Avatar with initials {initials}',
          },
          ContextualSaveBar: {
            save: 'Save',
            discard: 'Discard',
          },
          TextField: {
            characterCount: '{count} characters',
          },
          TopBar: {
            toggleMenuLabel: 'Toggle menu',
            toggleSearchLabel: 'Toggle search',
          },
          Modal: {
            i18n: {
              close: 'Close',
            },
          },
          Frame: {
            skipToContent: 'Skip to content',
            navigationLabel: 'Navigation',
            Navigation: {
              closeMobileNavigationLabel: 'Close navigation',
            },
          },
        },
      }}
    >
      <div style={{ padding: '20px' }}>
        <h1>Shopify Tagger App</h1>
        <p>Ready to start building!</p>
      </div>
    </PolarisAppProvider>
  )
}

export default App
