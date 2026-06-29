// Create Firestore default database via REST API using service account
const fs = require('fs')
const { GoogleAuth } = require('google-auth-library')

async function main() {
  const sa = JSON.parse(fs.readFileSync('D:/Dev/Secrets/dmforge-1df2e-firebase-adminsdk-fbsvc-5ec8bcd486.json', 'utf8'))
  const auth = new GoogleAuth({
    credentials: sa,
    scopes: ['https://www.googleapis.com/auth/datastore', 'https://www.googleapis.com/auth/cloud-platform'],
  })
  const client = await auth.getClient()
  const projectId = sa.project_id

  // Try creating the (default) Firestore database in us-central1 (Native mode)
  const url = `https://firestore.googleapis.com/v1/projects/${ projectId }/databases?databaseId=(default)`
  const body = {
    type: 'FIRESTORE_NATIVE',
    locationId: 'nam5',  // multi-region us-central
  }
  console.log('POST', url)
  try {
    const res = await client.request({ url, method: 'POST', data: body })
    console.log('CREATED:', JSON.stringify(res.data, null, 2).substring(0, 500))
  } catch (e) {
    console.log('ERR status:', e.response?.status)
    console.log('ERR data:', JSON.stringify(e.response?.data, null, 2)?.substring(0, 1000))
  }
}
main()
