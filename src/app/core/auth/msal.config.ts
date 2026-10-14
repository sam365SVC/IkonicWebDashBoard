import { IPublicClientApplication, PublicClientApplication } from '@azure/msal-browser'
import { environment } from '../../../environments/environment'
export function MSALInstanceFactory():IPublicClientApplication{
    return new PublicClientApplication({
        auth:{
            clientId:environment.msal?.clientId||'00000000-0000-0000-0000-000000000000',
            authority:environment.msal?.authority||'https://login.microsoftonline.com/common',
            redirectUri: environment.msal?.redirectUri || 'http://localhost:4202',
            postLogoutRedirectUri: environment.msal?.postLogoutRedirectUri || 'http://localhost:4202'
        },
        cache:{
            cacheLocation:'localStorage'
        }
    })
}

export const loginRequest={
    scopes:['User.Read','openid','profile','email']
}