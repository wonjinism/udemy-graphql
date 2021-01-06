import { ApolloClient } from 'apollo-client'
import { ApolloLink } from 'apollo-link'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'

const GITHUB_TOKEN = '038f5f770e6f94aa4769040926f38123f06a9f0b'
console.log(GITHUB_TOKEN)

const headersLink = new ApolloLink((operation, forward) => {
    operation.setContext({
        headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`
        }
    })
    return forward(operation)
})

const endpoint = 'https://api.github.com/graphql'
const httpLink = new HttpLink({ uri: endpoint }) 
const link = ApolloLink.from([headersLink, httpLink])

export default new ApolloClient({
    link,
    cache: new InMemoryCache()
})
