export const environment = {
  production: true,
  apiUrl: 'https://ikonicshopapi-bwfbgueeembwgqee.chilecentral-01.azurewebsites.net/api',
  msal: {
    clientId: 'badf7cc7-131d-447f-8cce-2af922ad3d99',
    authority: 'https://login.microsoftonline.com/consumers', // <--- CAMBIADO DE 'common' A 'consumers'
    redirectUri: 'https://nice-desert-0be592d10.2.azurestaticapps.net',
    postLogoutRedirectUri: 'https://nice-desert-0be592d10.2.azurestaticapps.net'
  }
};