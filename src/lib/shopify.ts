// Connects to your existing Shopify store via Storefront API
// Add to .env.local:
//   SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
//   SHOPIFY_STOREFRONT_TOKEN=your-public-storefront-token

const domain = process.env.SHOPIFY_STORE_DOMAIN
const token = process.env.SHOPIFY_STOREFRONT_TOKEN

async function shopifyFetch(query: string, variables = {}) {
  if (!domain || !token) {
    throw new Error('Shopify credentials not configured in .env.local')
  }

  const res = await fetch(`https://${domain}/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 60 }, // Cache for 60s, refresh in background
  })

  const json = await res.json()
  if (json.errors) throw new Error(json.errors[0].message)
  return json.data
}

export async function getProducts() {
  const data = await shopifyFetch(`
    {
      products(first: 24) {
        edges {
          node {
            id
            title
            handle
            description
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 2) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
          }
        }
      }
    }
  `)

  return data.products.edges.map(({ node }: any) => ({
    ...node,
    images: node.images.edges.map(({ node: img }: any) => img),
  }))
}

export async function getProductByHandle(handle: string) {
  const data = await shopifyFetch(`
    query getProduct($handle: String!) {
      product(handle: $handle) {
        id
        title
        handle
        description
        priceRange {
          minVariantPrice { amount currencyCode }
        }
        images(first: 5) {
          edges { node { url altText } }
        }
        variants(first: 10) {
          edges {
            node {
              id
              title
              price { amount currencyCode }
              availableForSale
            }
          }
        }
      }
    }
  `, { handle })

  const product = data.product
  if (!product) return null
  return {
    ...product,
    images: product.images.edges.map(({ node }: any) => node),
    variants: product.variants.edges.map(({ node }: any) => node),
  }
}
