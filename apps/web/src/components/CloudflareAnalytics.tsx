const CF_BEACON_TOKEN = 'd7be30ba784b4e3386466f09cea309b3'

export function CloudflareAnalytics() {
  return (
    <script
      defer
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token: CF_BEACON_TOKEN })}
    />
  )
}
