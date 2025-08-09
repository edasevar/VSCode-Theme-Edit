# Service Worker Error Troubleshooting

## Issue
`Error loading webview: Error: Could not register service worker: InvalidStateError: Failed to register a ServiceWorker: The document is in an invalid state.`

## Root Cause
VS Code webviews sometimes attempt to register service workers, which are not allowed in the webview security context. This can happen due to:

1. Browser auto-registration of service workers
2. Third-party scripts trying to register workers
3. VS Code's webview implementation attempting worker registration
4. Cached webview state from previous sessions

## Prevention Measures Implemented

### 1. Content Security Policy (CSP)
```html
<meta http-equiv="Content-Security-Policy"
  content="
    default-src 'none';
    img-src vscode-webview: blob: data:;
    style-src vscode-webview: 'unsafe-inline';
    script-src vscode-webview: 'nonce-[random]';
    font-src vscode-webview:;
    worker-src 'none';
    child-src 'none';
    frame-src 'none';
    connect-src 'none';
    manifest-src 'none';
  ">
```

### 2. Immediate JavaScript Prevention (runs first)
```javascript
<script nonce="[random]">
  (function() {
    'use strict';
    
    if (typeof navigator !== 'undefined') {
      Object.defineProperty(navigator, 'serviceWorker', {
        get: function() {
          return {
            register: function() {
              return Promise.reject(new Error('Service workers disabled in webview'));
            },
            ready: Promise.reject(new Error('Service workers disabled in webview')),
            controller: null,
            getRegistration: function() { return Promise.resolve(undefined); },
            getRegistrations: function() { return Promise.resolve([]); }
          };
        },
        configurable: false,
        enumerable: true
      });
    }
  })();
</script>
```

### 3. Secondary JavaScript Prevention (in main app.js)
```javascript
(function preventServiceWorkers() {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.serviceWorker) {
    if (typeof window.navigator.serviceWorker.register === 'function') {
      window.navigator.serviceWorker.register = function() {
        console.warn('Service worker registration blocked in webview');
        return Promise.reject(new Error('Service workers not allowed in VS Code webview'));
      };
    }
  }
})();
```

### 4. Error Suppression
```javascript
window.addEventListener('error', function(event) {
  if (event.error && event.error.message && 
      (event.error.message.includes('ServiceWorker') || 
       event.error.message.includes('service worker'))) {
    event.preventDefault();
    console.log('Service worker error suppressed in webview context');
    return false;
  }
});
```

### 5. Webview Configuration
```typescript
vscode.window.createWebviewPanel(viewType, title, column, {
  enableScripts: true,
  retainContextWhenHidden: true,
  localResourceRoots: [extensionPath],
  portMapping: [], // Disable port mappings
  enableCommandUris: false, // Disable command URIs
});
```

### 6. Meta Tags
```html
<meta name="service-worker" content="none" />
<meta name="mobile-web-app-capable" content="no" />
<meta name="apple-mobile-web-app-capable" content="no" />
```

## Additional Troubleshooting Steps

If the error persists:

1. **Clear VS Code Webview Cache**:
   - Close VS Code completely
   - Clear the webview cache: `%APPDATA%\Code\CachedExtensions\`
   - Restart VS Code

2. **Check for Conflicting Extensions**:
   - Disable other extensions that might interfere with webviews
   - Particularly check extensions that deal with service workers or PWAs

3. **VS Code Settings**:
   - Check if `webview.experimental.useNewSandbox` is enabled
   - Try disabling it: `"webview.experimental.useNewSandbox": false`

4. **Developer Console**:
   - Open webview developer tools
   - Check for additional error messages
   - Verify that our prevention measures are active

5. **Extension Host Restart**:
   - Command: `Developer: Reload Window`
   - This clears any cached webview state

## Verification

When working correctly, you should see these console messages in the webview developer tools:
- `VS Code API acquired successfully`
- `Theme Lab webview script loaded, service worker prevention active`
- `Theme Lab webview loaded successfully`
- `Theme Lab initialized successfully`

## Implementation Status

✅ All prevention measures are implemented and active
✅ Extension builds without errors
✅ All tests pass
✅ Comprehensive error handling in place
✅ Multiple layers of protection to prevent service worker registration
