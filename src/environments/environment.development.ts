export const environment = {
  production: false,
  apiUrl: 'https://ikonicshopapi-bwfbgueeembwgqee.chilecentral-01.azurewebsites.net/api',
  msal: {
    clientId: 'badf7cc7-131d-447f-8cce-2af922ad3d99', // Reemplaza por tu Client ID de Azure
    authority: 'https://login.microsoftonline.com/consumers', // <--- CAMBIADO DE 'common' A 'consumers'
    redirectUri: 'http://localhost:4202',
    postLogoutRedirectUri: 'http://localhost:4202'
  }
};