const puppeteer = require("puppeteer");
const pdf = require("pdfkit");
const fs = require("fs");
let ctab;
(async function () {
   try {
      let browserOpen = puppeteer.launch({
         headless: false,
         defaultViewport: null,
         args: ["--start-maximized"],
      });
      let browserOpened = await browserOpen;
      let alltabsArr = await browserOpened.pages();
      ctab = alltabsArr[0];
      await ctab.goto(
         "https://www.youtube.com/playlist?list=PLzkuLC6Yvumv_Rd5apfPRWEcjf9b1JRnq"
      );
      await ctab.waitForSelector("h1#title");
      let name = await ctab.evaluate(function (select) {
         return document.querySelector(select).innerText;
      }, "h1#title");
      console.log(name);
      let dataneeded = await ctab.evaluate(
         getData,
         "#stats .style-scope.ytd-playlist-sidebar-primary-info-renderer"
      );
      let totalViews = dataneeded.noofViews.trim().split(" ")[0];
      console.log("total views: ", totalViews);
      let totalVideos = dataneeded.noOfVideos.trim().split(" ")[0];
      console.log(totalVideos);
      let currentTotalVideos = await getCvideosLength();
      console.log(currentTotalVideos);
      while (totalVideos - currentTotalVideos >= 20) {
         await gotoBottom();
         currentTotalVideos = await getCvideosLength();
      }
      let finalList = await getStats();
      // console.log(finalList);
      let pdfdoc = new pdf();
      pdfdoc.pipe(fs.createWriteStream('play.pdf'));
      pdfdoc.text(JSON.stringify(finalList));
      pdfdoc.end();
   } catch (error) {
      console.log(error);
   }
})();
//title selector->a#video-title
//time selector->span#text
function getData(selector) {
   let allElements = document.querySelectorAll(selector);
   let noOfVideos = allElements[0].innerText;
   let noofViews = allElements[1].innerText;
   return {
      noOfVideos,
      noofViews,
   };
}

async function getCvideosLength() {
   let length = await ctab.evaluate(
      getLength,
      "#contents .style-scope.ytd-playlist-video-list-renderer[responsive]"
   );
   return length;
}
function getLength(selector) {
   let durationElem = document.querySelectorAll(selector);
   return durationElem.length;
}
async function gotoBottom() {
   await ctab.evaluate(scrollBottom);
   function scrollBottom() {
      window.scrollBy(0, window.innerHeight);
   }
}
async function getStats() {
   let list = ctab.evaluate(getNameAndDuration, "a#video-title", "span#text");
   return list;
}
function getNameAndDuration(videoselector, durationselector) {
   let videoElement = document.querySelectorAll(videoselector);
   let durationElement = document.querySelectorAll(durationselector);
   let currentList = [];

   for (let i = 0; i < durationElement.length; i++) {
      let videoTitle = videoElement[i].innerText.trim();
      let duration = durationElement[i].innerText.trim();
      currentList.push({ videoTitle, duration });
   }

   return currentList;
}
