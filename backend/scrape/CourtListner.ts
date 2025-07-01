import axios from 'axios';

export async function* scrapeCourtListener(): AsyncGenerator<{
    filePath: any;
    id: any;
    text: any;
    type: any;
    pageCount: any;
    opinions_cited: any;
    cluster_id: any;
}, void, unknown> {
  try {
    const response = await axios.get(
      'https://www.courtlistener.com/api/rest/v4/opinions/'
    );

    const results = response.data.results;

    for (const item of results) {

        // const data = `the data from item ${item.id} is ${item.plain_text}`
        const data = {
            filePath : item.resource_uri,
            id : item.id,
            text : item.plain_text,
            type : item.type,
            pageCount : item.page_count,
            opinions_cited : item.opinions_cited,
             cluster_id: item. cluster_id,


        }
      yield data;
    }
  } catch (error) {
    console.error('Failed to scrape CourtListener API', error);
    throw error;
  }
}


// (async ()=>{
//     for await (const data of scrapeCourtListener()) {
// //   console.log(data); // Each plain_text as soon as it's available
// console.log('='.repeat(60))
// console.log('scraping started')
// console.log('te all data of ',data.text)
// console.log(data.filePath)
// console.log(data.id)
// console.log(data.type)
// console.log(data.pageCount)
// console.log(data.opinions_cited)
// // console.log(data.text)
// }
// })();