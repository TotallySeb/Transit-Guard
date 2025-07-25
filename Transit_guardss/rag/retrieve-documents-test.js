// retrieve-documents-test.js

const { getQueryResults } = require('./retrieve-documents.js'); // Updated to CommonJS import

async function run() {
    try {
        const query = "AI Technology";
        const documents = await getQueryResults(query);

        documents.forEach( doc => {
            console.log(doc);
        });
    } catch (err) {
        console.log(err.stack);
    }
}
run().catch(console.dir);