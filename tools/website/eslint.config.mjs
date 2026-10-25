export default [{
  files: ['**/*.js', '**/*.mjs'],
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    globals: Object.fromEntries(['document', 'window', 'location', 'history', 'navigator', 'localStorage', 'matchMedia', 'IntersectionObserver', 'requestAnimationFrame', 'scrollY', 'console', 'process', 'URL', 'URLSearchParams', 'structuredClone'].map(name => [name, 'readonly']))
  },
  rules: {
    'no-undef': 'error',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-unreachable': 'error',
    'valid-typeof': 'error'
  }
}];
