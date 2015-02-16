/*-------------------
Developed by: John Purcell
Contact info
- Twitter: @HLIBindustry
- Blog: eve-prosper.blogspot.com
Purpose:
A suite of API/CREST scraping tools for use in Google sheets for EVE Online data

Legal:
API/CREST is property of CCP hf. 
Code is distributed free-of-charge, and should not be used for commercial gain
Code is open source, but notification is appreciated on any modifications

Developed as part of the CriusDev project: https://github.com/lockefox/CriusDev
*/
var base_CREST_URL = "http://public-crest.eveonline.com/";
var test_CREST_URL = "http://public-crest-sisi.testeveonline.com/";
var base_API_URL = "https://api.eveonline.com/char/AssetList.xml.aspx?";
var jobType ={};

var min_wait = 10;
var max_wait = 500;

JobType = {1:"Manufacturing",
           3:"Researching Time Efficiency",
           4:"Researching Material Efficiency",
           5:"Copying",
           7:"Reverse Engineering",
           8:"Invention"};

var jobType_arr = [];
jobType_arr = ["NOT VALID", "Manufacturing", "NOT VALID", "Researching Time Efficiency", "Researching Material Efficiency", "Copying", "NOT VALID", "Reverse Engineering", "Invention"];

//TODO: verify status values//
var status_arr = [];
status_arr = ["Failed", "Delivered", "Aborted", "GM Aborted", "Inflight Unachored", "Destroyed"];
////	UTILITIES	////
function isInArray(value, array) {
  return array.indexOf(value) > -1;
}

function lshift(data_array, shift_count){//shifts an array left.	DESTRUCTIVE!
  var hold_array = [];
  var filler ="";
  
  var data_copy = data_array;//holds data (destructive operation)
  
  for (var rows=0; rows < data_array.length; rows++){
    hold_array = data_copy[rows];
    for (var cnt=0; cnt < shift_count; cnt++){
      var trash = hold_array.shift();
    }
    data_copy[rows]=hold_array;
  }
  
  return data_copy;
}

function zero_array(array_length){
  var out_array = []
  for (var i=0; i<array_length; i++){
    out_array[i]=0 
  }
  return out_array
}

function date_array(days)
{
  var daterange = [];
  
  var mydate = new Date();
  
  mydate.setDate(mydate.getDate()-1);//API doesn't give TODAY's data
  for (var datestep=0; datestep<days; datestep++)
  {
    var datestr = "";
    var month = mydate.getMonth()+1;
    if (month < 10)
    {
      month = "0"+month;
    }
    var day = mydate.getDate();
    if (day <10)
    {
      day = "0"+day;
    }
    datestr = mydate.getFullYear()+"-"+month+"-"+day+"T00:00:00";
    daterange[datestep] = datestr;
    mydate.setDate(mydate.getDate()-1);
  }
  
  return daterange;
}

function getAllianceID(keyID, vCode, systemList)
{
  parameters = {
    method : "post",
    payload :
    "keyID=" + encodeURIComponent(keyID) +
    "&vCode=" + encodeURIComponent(vCode)
  };
  Utilities.sleep(1000);
  
  var info = ""
  try{//generic query error
    Utilities.sleep(1000);
    var info = UrlFetchApp.fetch("https://api.eveonline.com/account/APIKeyInfo.xml.aspx?",parameters).getContentText();
  }catch (e){
    throw e;
  }
  
  var infoXML = Xml.parse(info,true);
  var KeyOwnerInfo = infoXML.eveapi.result.key.rowset.row.getElements();
  
  var allianceID = Number(KeyOwnerInfo.getAttribute("allianceID").getValue());
  
  return allianceID;
}

function fetchRawAPI(keyID,vCode,API_string,add_args,test_server)
{
  if(add_args)
  {
    var parameters = {
      method : "post",
      payload :
      "keyID=" + encodeURIComponent(keyID) +
      "&vCode=" + encodeURIComponent(vCode) +
      add_args,
      user_agent : "Lockefox @HLIBindustry GDOC scripts",
    };
  }
  else
  {
    var parameters = {
      method : "post",
      payload :
      "keyID=" + encodeURIComponent(keyID) +
      "&vCode=" + encodeURIComponent(vCode),
      user_agent : "Lockefox @HLIBindustry GDOC scripts",
    };
  }
  
  var API_addr = "";
  if(test_server) API_addr = "https://api.testeveonline.com/";
  else API_addr = "https://api.eveonline.com/";
  
  var info = ""
  var ret_arr = []
  try{//generic query error
    Utilities.sleep(1000);
    var info = UrlFetchApp.fetch(API_addr+API_string,parameters).getContentText();
  }catch (e){
    ret_arr.push(e);
    try{
      if(add_args)
      {
        var parameters = {
          method : "post",
          payload :
          "keyID=" + encodeURIComponent(keyID) +
          "&vCode=" + encodeURIComponent(vCode) +
          add_args,
          user_agent : "Lockefox @HLIBindustry GDOC scripts",
          muteHttpExceptions : true
        };
      }
      else
      {
        var parameters = {
          method : "post",
          payload :
          "keyID=" + encodeURIComponent(keyID) +
          "&vCode=" + encodeURIComponent(vCode),
          user_agent : "Lockefox @HLIBindustry GDOC scripts",
          muteHttpExceptions : true
        };
      }
      Utilities.sleep(1000);
      info = UrlFetchApp.fetch(API_addr+API_string,parameters).getContentText()
      ret_arr.push(info)
    }
    catch (er){
      throw er
    }
    return ret_arr
  }
  return info
}

////	FETCH FUNCS		////
function __fetchCrest_market(region_id,item_id)
{
  var parameters = {
    method : "get",
    user_agent : "Lockefox @HLIBindustry GDOC scripts",
  }
  
  var sleeptime = min_wait + (max_wait - min_wait)*Math.random();
  Utilities.sleep(sleeptime);
  var url = base_CREST_URL+"market/"+region_id+"/types/"+item_id+"/history/"
  var text = UrlFetchApp.fetch(url,parameters);
  var json_obj = JSON.parse(text);
  
  return json_obj;
}

function __fetchSystemIndexes(test_server)
{
  var base_url="";
  
  if(test_server) base_url = test_CREST_URL;
  else base_url = base_CREST_URL;
  //	if(test_server === undefined) base_url = base_CREST_URL; //allow switching between test/live server (for debug)
  //	else base_url = test_CREST_URL;
  //	
  var parameters = {
    method : "get",
    user_agent : "Lockefox @HLIBindustry GDOC scripts",
  }
  var url = base_url+"industry/systems/";
  Utilities.sleep(1000);
  var text = UrlFetchApp.fetch(url,parameters);
  var json_obj = JSON.parse(text);
  
  return json_obj;
}

function __fetchMarketPrices(test_server)
{
  var base_url="";
  
  if(test_server) base_url = test_CREST_URL;
  else base_url = base_CREST_URL;
  //	if(test_server === undefined) base_url = base_CREST_URL; //allow switching between test/live server (for debug)
  //	else base_url = test_CREST_URL;
  //	
  var parameters = {
    method : "get",
    user_agent : "Lockefox @HLIBindustry GDOC scripts",
  }
  var url = base_url+"market/prices/";
  Utilities.sleep(1000);
  var text = UrlFetchApp.fetch(url,parameters);
  var json_obj = JSON.parse(text);
  
  return json_obj;
}

function API_validateKey(keyID, vCode, expected_type, CAK_mask, test_server)
{
  //Takes API info and throws errors if bad
  
  var parameters = {
    method : "post",
    payload :
    "keyID=" + encodeURIComponent(keyID) +
    "&vCode=" + encodeURIComponent(vCode),
    user_agent : "Lockefox @HLIBindustry GDOC scripts",
  };
  
  var API_addr = "";
  if(test_server) API_addr = "https://api.testeveonline.com/";
  else API_addr = "https://api.eveonline.com/";
  
  var info = ""
  try{//generic query error
    Utilities.sleep(1000);
    var info = UrlFetchApp.fetch(API_addr+"account/APIKeyInfo.xml.aspx?",parameters).getContentText();
  }catch (e){
    throw e;
  }
  
  var infoXML = Xml.parse(info,true);
  var accessMask = infoXML.eveapi.result.key.getAttribute("accessmask").getValue();
  var keytype = infoXML.eveapi.result.key.getAttribute("type").getValue();
  
  if (keytype != expected_type){
    if (!(keytype == "Account" && expected_type == "Character"))
      throw "Invalid key type:" +	keytype + "Expected: " + expected_type;
  }
  
  if ((Number(accessMask) & CAK_mask) == 0){
    throw "Invalid access mask: " + accessMask + "Expected: " + CAK_mask; 
  }
  //make "EXPIRED" case
}

////	GDOC FUNCS		////

function getPOS(keyID, vCode, header_bool, verbose_bool, test_server)
{
  var can_Locations = true;
  var can_POSDetails= true;
  
  
  try{
    var can_Locations = true;
    API_validateKey(keyID, vCode, "Corporation", 16777216, test_server);
  }catch(err){
    can_Locations = false;
  }
  
  try{
    var can_POSDetails= true;
    API_validateKey(keyID, vCode, "Corporation", 131072, test_server);
  }catch(err){
    can_POSDetails = false;
  }
  
  try{
    API_validateKey(keyID, vCode, "Corporation", 524288, test_server);
  }catch(err){
    return err;
  }
  
  //var allianceID = getAllianceID(keyID, vCode);
  
  parameters = {
    method : "post",
    payload :
    "keyID=" + encodeURIComponent(keyID) +
    "&vCode=" + encodeURIComponent(vCode),
    user_agent : "Lockefox @HLIBindustry GDOC scripts",
  };
  Utilities.sleep(1000);
  var API_addr = "";
  var call_mod = "";
  
  //switch call for test/live server
  if(test_server) API_addr = "https://api.testeveonline.com/";
  else API_addr = "https://api.eveonline.com/";
  
  var api_query = API_addr+"corp/StarbaseList.xml.aspx?"//keyID="+keyID+"&vCode="+vCode;
  var POS_api = UrlFetchApp.fetch(api_query, parameters).getContentText();
  var POSXML = Xml.parse(POS_api,true);
  var POSList = POSXML.eveapi.result.rowset.getElements("row");
  
  //var standings_owner = POSList[0].getAttribute("standingOwnerID");
  var return_array = [];
  
  if(header_bool)
  {
    var header = []
    
    if (verbose_bool)	header.push("itemID");
    if (can_Locations)	header.push("towerName");
    if (verbose_bool)	header.push("typeID");
    header.push("typeName");
    if (verbose_bool)	header.push("solarSystemID");
    header.push("solarSystemName");
    if (verbose_bool)	header.push("moonID");
    header.push("Location");
    header.push("Status");
    if (verbose_bool)	header.push("stateTimestamp");
    if (verbose_bool)	header.push("onlineTimestamp");
    if (verbose_bool)	header.push("standingOwnerID");
    if (verbose_bool)	header.push("standingOwner");
    if (can_POSDetails)	header.push("fuelRemaining");
    if (can_POSDetails)	header.push("chartersRemaining");
    if (can_POSDetails)	header.push("strontiumRemaining");
    if (can_POSDetails)	header.push("fuelTimeHours");
    if (can_POSDetails)	header.push("strontTimeHours");
    
    return_array.push(header);
  }
  
  var towerIDs = [];
  var towerName_conv = {};
  
  if(can_Locations || can_POSDetails)
  {//get a towerID list
    for (var towerNum = 0; towerNum < POSList.length; towerNum++)
    {
      towerIDs.push(POSList[towerNum].getAttribute("itemid").getValue());
    }
    
    if(can_Locations && (POSList.length > 0))
    towerName_conv = getLocations(keyID, vCode, towerIDs.join(), test_server);
  }
  
  
  for(var towerNum = 0; towerNum < POSList.length; towerNum++)
  {
    var tower_line = [];
    
    var towerID	 = POSList[towerNum].getAttribute("itemid").getValue();
    var towerName = "";
    if(can_Locations)
      towerName = towerName_conv[towerID];
    
    var towerTypeID = POSList[towerNum].getAttribute("typeid").getValue();
    
    var solarSystemID = POSList[towerNum].getAttribute("locationid").getValue();
    var moonID = POSList[towerNum].getAttribute("moonid").getValue();
    var solarSystemLookup = UrlFetchApp.fetch("https://www.fuzzwork.co.uk/api/mapdata.php?itemid="+moonID+"&format=xml").getContentText();
    var SS_XML = Xml.parse(solarSystemLookup,true);
    
    var solarSystemName = SS_XML.eveapi.row.getElements("solarsystemname")[0].getText()
    var moonName = SS_XML.eveapi.row.getElements("itemname")[0].getText();
    
    
    var fuel_remain = 0;
    var chrt_remain = 0;
    var strt_remain = 0;
    var fuel_time_h = 0;
    var strt_time_h = 0;
    if(can_POSDetails)
    {
      parameters = {
        method : "post",
        payload :
        "keyID=" + encodeURIComponent(keyID) +
        "&vCode=" + encodeURIComponent(vCode) +
        "&itemID=" + encodeURIComponent(towerID),
        user_agent : "Lockefox @HLIBindustry GDOC scripts",
      };
      
      api_query = API_addr+"corp/StarbaseDetail.xml.aspx?";
      var det_api = UrlFetchApp.fetch(api_query, parameters).getContentText();
      var detXML = Xml.parse(det_api,true);
      var detList = detXML.eveapi.result.rowset.getElements("row"); 
      
      for(var invRow = 0; invRow < detList.length; invRow++)
      {
        var contents_id = detList[invRow].getAttribute("typeid").getValue();
        var quantity		= Number(detList[invRow].getAttribute("quantity").getValue());
        if		(contents_id == stront)
          strt_remain = quantity;
        else if (charters.indexOf(contents_id) > -1)
          chrt_remain = quantity;
        else if (fuelBlocks.indexOf(contents_id) > -1)
          fuel_remain = quantity;
      }
      
      var fuel_hours = Math.floor(fuel_remain/(fuel_perhour_conv[towerTypeID]));
      
      fuel_time_h = fuel_hours;
      strt_time_h = Math.floor(strt_remain/(stront_perhour_conv[towerTypeID]))
      /*--TODO: DO SOV lookup and charter Fuel Math--*/	
    }
    
    if (verbose_bool)	tower_line.push(Number(towerID));
    if (can_Locations)	tower_line.push(			 towerName);
    if (verbose_bool)	tower_line.push(Number(towerTypeID));
    tower_line.push(			 POS_typeID_conv[towerTypeID]);
    if (verbose_bool)	tower_line.push(Number(solarSystemID));
    tower_line.push(			 solarSystemName);
    if (verbose_bool)	tower_line.push(Number(moonID));
    tower_line.push(			 moonName);
    tower_line.push(			 POS_status[Number(POSList[towerNum].getAttribute("state").getValue())]);
    if (verbose_bool)	tower_line.push(			 POSList[towerNum].getAttribute("statetimestamp"));
    if (verbose_bool)	tower_line.push(			 POSList[towerNum].getAttribute("onlinetimestamp"));
    if (verbose_bool)	tower_line.push(			 POSList[towerNum].getAttribute("standingownerid"));
    if (verbose_bool)	tower_line.push(			 POSList[towerNum].getAttribute("standingownerid"));
    if (can_POSDetails)	tower_line.push(			 fuel_remain);
    if (can_POSDetails)	tower_line.push(			 chrt_remain);
    if (can_POSDetails)	tower_line.push(			 strt_remain);
    if (can_POSDetails)	tower_line.push(			 fuel_time_h);
    if (can_POSDetails)	tower_line.push(			 strt_time_h);
    
    return_array.push(tower_line);
  }
  
  return return_array;
  
}

function getFacilities(keyID, vCode, header_bool, verbose_bool, test_server)
{
  /////Check if key can do the ID->name conversion/////
  
  try{
    var can_Locations = true;
    API_validateKey(keyID, vCode, "Corporation", 16777216, test_server);
  }catch(err){
    can_Locations = false;
  }
  
  try{
    API_validateKey(keyID, vCode, "Corporation", 2, test_server);//foxfour says says accessMask corp/facilities = /corp/assets
  }catch(err){
    return err;
  }
  
  ////SET UP ADDRESS CALL////	
  parameters = {
    method : "post",
    payload :
    "keyID=" + encodeURIComponent(keyID) +
    "&vCode=" + encodeURIComponent(vCode),
    user_agent : "Lockefox @HLIBindustry GDOC scripts",
  };
  Utilities.sleep(1000);
  var API_addr = "";
  var call_mod = "";
  
  
  //switch call for test/live server
  if(test_server) API_addr = "https://api.testeveonline.com/";
  else API_addr = "https://api.eveonline.com/";
  
  var api_query = API_addr+"corp/Facilities.xml.aspx?"//keyID="+keyID+"&vCode="+vCode;
  var fac_api = UrlFetchApp.fetch(api_query, parameters).getContentText();
  var facXML = Xml.parse(fac_api,true);
  var facList = facXML.eveapi.result.rowset.getElements("row");
  
  var return_array = [];
  
  if(header_bool)
  {
    var header = []
    
    if (verbose_bool)	header.push("facilityID");
    if (can_Locations)	header.push("facilityName");
    if (verbose_bool)	header.push("typeID");
    header.push("typeName");
    if (verbose_bool)	header.push("solarSystemID");
    header.push("solarSystemName");
    if (verbose_bool)	header.push("regionID");
    header.push("regionName");
    if (verbose_bool)	header.push("starbaseModifier");
    header.push("tax");
    
    /*--TODO: publish facility bonuses?--*/
    return_array.push(header);
  }
  
  var facName_conv = {};
  
  if(can_Locations)
  {//process whole list, and pull names all at once.
    var ID_list = [];
    for (var rowNum = 0; rowNum < facList.length; rowNum++)
    {//get all facility id's
      //ID_list = ID_list+facList[rowNum].getAttribute("facilityid").getValue()+",";
      ID_list.push(facList[rowNum].getAttribute("facilityid").getValue());
    }
    if (facList.length > 0)
      facName_conv = getLocations(keyID, vCode, ID_list.join(), test_server);
  }
  
  for (var rowNum = 0; rowNum < facList.length; rowNum++)
  {
    var fac_line = [];
    
    var facID = facList[rowNum].getAttribute("facilityid").getValue();
    var facName = facName_conv[facID];
    
    if (verbose_bool)	fac_line.push(Number(facID));
    if (can_Locations)	fac_line.push(			 facName);
    if (verbose_bool)	fac_line.push(Number(facList[rowNum].getAttribute("typeid").getValue()));
    fac_line.push(			 facList[rowNum].getAttribute("typename").getValue());
    if (verbose_bool)	fac_line.push(Number(facList[rowNum].getAttribute("solarsystemid").getValue()));
    fac_line.push(			 facList[rowNum].getAttribute("solarsystemname").getValue());
    if (verbose_bool)	fac_line.push(Number(facList[rowNum].getAttribute("regionid").getValue()));
    fac_line.push(			 facList[rowNum].getAttribute("regionname").getValue());
    if (verbose_bool)	fac_line.push(Number(facList[rowNum].getAttribute("starbasemodifier").getValue()));
    fac_line.push(Number(facList[rowNum].getAttribute("tax").getValue()));
    
    /*--TODO: publish facility bonuses?--*/
    return_array.push(fac_line);
  }
  return return_array;
}

function getLocations(keyID, vCode, csv_ID_list, test_server)
{
  var id_to_name = {};
  
  try{
    API_validateKey(keyID, vCode, "Corporation", 16777216, test_server);
  }catch(badkey){
    throw badkey;
  }
  
  parameters = {
    method : "post",
    payload :
    "keyID=" + encodeURIComponent(keyID) +
    "&vCode=" + encodeURIComponent(vCode) +
    "&IDs=" + encodeURIComponent(csv_ID_list),
    user_agent : "Lockefox @HLIBindustry GDOC scripts",
  };
  Utilities.sleep(1000);
  var API_addr="";
  if(test_server) API_addr = "https://api.testeveonline.com/";
  else API_addr = "https://api.eveonline.com/";
  
  var name_query = API_addr+"corp/Locations.xml.aspx?";
  var name_api = UrlFetchApp.fetch(name_query, parameters).getContentText();;
  var nameXML = Xml.parse(name_api,true);
  
  var nameList = nameXML.eveapi.result.rowset.getElements("row");
  
  for (var itemNum = 0; itemNum < nameList.length; itemNum ++)
  {
    var itemID	 = nameList[itemNum].getAttribute("itemid").getValue();
    var itemName = nameList[itemNum].getAttribute("itemname").getValue();
    
    //NOTE: itemID is a string!!
    id_to_name[itemID] = itemName;
  }
  
  return id_to_name;
}

function getLocation (keyID, vCode, itemID, test_server)
{
  var locations_obj = {};
  locations_obj = getLocations(keyID, vCode, itemID, test_server);
  return locations_obj[itemID];
}

function getIndustryJobs(keyID, vCode, header_bool, verbose_bool, test_server)
{
  try{
    var can_Locations = true;
    API_validateKey(keyID, vCode, "Corporation", 16777216, test_server);
  }catch(err){
    can_Locations = false;
  }
  
  var personal_or_corp = 0;	//0=personal, 1=corp
  try{
    API_validateKey(keyID, vCode, "Character", 128, test_server);
  }catch(err){
    personal_or_corp = 1;
    try{
      API_validateKey(keyID, vCode, "Corporation", 128, test_server);
    }catch(badkey){
      return badkey;
    }
  }
  ////SET UP ADDRESS CALL////	
  parameters = {
    method : "post",
    payload :
    "keyID=" + encodeURIComponent(keyID) +
    "&vCode=" + encodeURIComponent(vCode),
    user_agent : "Lockefox @HLIBindustry GDOC scripts",
  };
  Utilities.sleep(1000);
  var API_addr = "";
  var call_mod = "";
  
  //switch call for personal/corp
  if (personal_or_corp == 0) call_mod = "char";
  else call_mod = "corp";
  
  //switch call for test/live server
  if(test_server) API_addr = "https://api.testeveonline.com/";
  else API_addr = "https://api.eveonline.com/";
  
  var api_query = API_addr+call_mod+"/IndustryJobs.xml.aspx?"//keyID="+keyID+"&vCode="+vCode;
  var job_api = UrlFetchApp.fetch(api_query, parameters).getContentText();;
  var jobXML = Xml.parse(job_api,true);
  
  var jobList = jobXML.eveapi.result.rowset.getElements("row");
  
  var return_array = [];
  if(header_bool)
  {
    var header = []
    if (verbose_bool)	header.push("jobID");
    if (verbose_bool)	header.push("installerID");
    header.push("installerName");
    if (verbose_bool)	header.push("facilityID");
    header.push("facilityName");
    if (verbose_bool)	header.push("solarSystemID");
    header.push("solarSystemName");
    if (verbose_bool)	header.push("stationID");
    header.push("stationName");
    if (verbose_bool)	header.push("activityID");
    header.push("activity");
    if (verbose_bool)	header.push("blueprintID");	
    header.push("blueprintTypeID");
    header.push("blueprintTypeName");
    if (verbose_bool)	header.push("blueprintLocationID");						
    if (verbose_bool)	header.push("outputLocationID");
    header.push("runs");
    header.push("cost");
    header.push("teamID");
    if (verbose_bool)	header.push("licensedRuns");	
    if (verbose_bool)	header.push("probability");	
    if (verbose_bool)	header.push("productTypeName");
    header.push("status");
    header.push("timeInSeconds");
    header.push("startDate");
    header.push("endDate");
    if (verbose_bool)	header.push("pauseDate");
    if (verbose_bool)	header.push("completedDate");
    if (verbose_bool)	header.push("completedCharacterID");	
    
    return_array.push(header);
  }
  
  var location_lookup = {};
  for (var jobNum = 0; jobNum < jobList.length; jobNum++)
  {
    job_line = [];
    
    var activityID	 = Number(jobList[jobNum].getAttribute("activityid").getValue());	
    var activityName = "";
    try{
      activityName = jobType_arr[activityID];
    }catch (err){
      activityName = "UKN ACTIVITYID";
    }
    
    var facilityID = jobList[jobNum].getAttribute("facilityid").getValue();
    var stationID	= jobList[jobNum].getAttribute("stationid").getValue();
    
    var facilityName = "";
    var stationName	= "";
    
    if (facilityID in location_lookup)
      facilityName = location_lookup[facilityID]
      else
      {
        var facilityName_lookup = "";
        try{
          var NPCfac_lookup = UrlFetchApp.fetch("https://www.fuzzwork.co.uk/api/mapdata.php?itemid="+facilityID+"&format=xml").getContentText();
          var NPCfacXML = Xml.parse(NPCfac_lookup,true);
          
          facilityName_lookup = NPCfacXML.eveapi.row.getElements("itemname")[0].getText();
        }catch (err1){
          //Value wasn't an NPC space
          //THIS PROBABLY WON'T WORK FOR OUTPOSTS
          if(can_Locations)
          {
            facilityName_lookup = getLocation(keyID, vCode, facilityID, test_server);
          }
          else
          {//BLANK rather than spam
            facilityName_lookup = ""
          }
        }
        location_lookup[facilityID] = facilityName_lookup;
        facilityName = facilityName_lookup;
      }		
    
    if (stationID in location_lookup)
      stationName = location_lookup[stationID]
      else
      {
        var stationID_lookup = "";
        try{
          var NPCfac_lookup = UrlFetchApp.fetch("https://www.fuzzwork.co.uk/api/mapdata.php?itemid="+stationID+"&format=xml").getContentText();
          var NPCfacXML = Xml.parse(NPCfac_lookup,true);
          
          stationID_lookup = NPCfacXML.eveapi.row.getElements("itemname")[0].getText();
        }catch (err1){
          //Value wasn't an NPC space
          //THIS PROBABLY WON'T WORK FOR OUTPOSTS
          if(can_Locations)
          {
            stationID_lookup = getLocation(keyID, vCode, stationID, test_server);
          }
          else
          {//BLANK rather than spam
            stationID_lookup = "NO LOOKUP"
          }
          
          
          
        }
        location_lookup[stationID] = stationID_lookup;
        stationName = stationID_lookup;
      }
    
    //no smart casing, lower case only for attribute ID's//
    if (verbose_bool)	job_line.push(Number(jobList[jobNum].getAttribute("jobid").getValue()));
    if (verbose_bool)	job_line.push(Number(jobList[jobNum].getAttribute("installerid").getValue()));
    job_line.push(		 jobList[jobNum].getAttribute("installername").getValue());
    if (verbose_bool)	job_line.push(Number(facilityID));
    job_line.push(		 facilityName);
    if (verbose_bool)	job_line.push(Number(jobList[jobNum].getAttribute("solarsystemid").getValue()));
    job_line.push(		 jobList[jobNum].getAttribute("solarsystemname").getValue());
    if (verbose_bool)	job_line.push(Number(stationID));
    job_line.push(		 stationName);
    /*------------*/
    if (verbose_bool)	job_line.push(Number(activityID));				
    job_line.push(activityName);
    /*------------*/					
    if (verbose_bool)	job_line.push(Number(jobList[jobNum].getAttribute("blueprintid").getValue()));
    job_line.push(Number(jobList[jobNum].getAttribute("blueprinttypeid").getValue()));
    job_line.push(		 jobList[jobNum].getAttribute("blueprinttypename").getValue());
    if (verbose_bool)	job_line.push(Number(jobList[jobNum].getAttribute("blueprintlocationid").getValue()));						
    if (verbose_bool)	job_line.push(Number(jobList[jobNum].getAttribute("outputlocationid").getValue()));
    job_line.push(Number(jobList[jobNum].getAttribute("runs").getValue()));
    job_line.push(Number(jobList[jobNum].getAttribute("cost").getValue()));
    job_line.push(Number(jobList[jobNum].getAttribute("teamid").getValue()));
    if (verbose_bool)	job_line.push(Number(jobList[jobNum].getAttribute("licensedruns").getValue()));	
    if (verbose_bool)	job_line.push(Number(jobList[jobNum].getAttribute("probability").getValue()));	
    if (verbose_bool)	job_line.push(		 jobList[jobNum].getAttribute("producttypename").getValue());
    /*TODO ID->STR*/	job_line.push(Number(jobList[jobNum].getAttribute("status").getValue()));
    job_line.push(Number(jobList[jobNum].getAttribute("timeinseconds").getValue()));
    job_line.push(		 jobList[jobNum].getAttribute("startdate").getValue());
    job_line.push(		 jobList[jobNum].getAttribute("enddate").getValue());
    if (verbose_bool)	job_line.push(		 jobList[jobNum].getAttribute("pausedate").getValue());
    if (verbose_bool)	job_line.push(		 jobList[jobNum].getAttribute("completeddate").getValue());
    if (verbose_bool)	job_line.push(Number(jobList[jobNum].getAttribute("completedcharacterid").getValue()));	
    
    return_array.push(job_line);
  }
  
  return return_array;
}

function getSkills(keyID, vCode, characterID, production_skills, science_skills, refining_skills, test_server)
{
  if (typeof characterID == 'undefined')
    throw 'need characterID';
  if (typeof production_skills == 'undefined')
    production_skills = true;		
  if (typeof science_skills == 'undefined')
    science_skills = true;
  if (typeof refining_skills == 'undefined')
    refining_skills = true;	
  if (typeof test_server == 'undefined')
    test_server = false;		
  
  try{
    var can_Locations = true;
    API_validateKey(keyID, vCode, "Character", 8, test_server);
  }catch (badkey){
    return badkey;
  }
  
  parameters = {
    method : "post",
    payload :
    "keyID=" + encodeURIComponent(keyID) +
    "&vCode=" + encodeURIComponent(vCode) +
    "&characterID=" + encodeURIComponent(characterID),
    user_agent : "Lockefox @HLIBindustry GDOC scripts",
  };
  Utilities.sleep(1000);
  var API_addr = "";
  var call_mod = "char";
  
  if(test_server) API_addr = "https://api.testeveonline.com/";
  else API_addr = "https://api.eveonline.com/";
  
  var api_query = API_addr+call_mod+"/CharacterSheet.xml.aspx?"//keyID="+keyID+"&vCode="+vCode;
  var char_api = UrlFetchApp.fetch(api_query, parameters).getContentText();;
  var charXML = Xml.parse(char_api,true);
  
  var findRowset = charXML.eveapi.result.getElements("rowset");
  var skills_indx = 0;
  
  for (skills_indx = 0; skills_indx < findRowset.length; skills_indx++)
  {
    //debug.push(findRowset[skills_indx].getAttribute("name").getValue());
    if(findRowset[skills_indx].getAttribute("name").getValue() == "skills")
      break; //set skill_indx to whatever index we find "skills"
  }
  if (skills_indx >= findRowset.length)
    throw "unable to find 'skills' subset on char sheet";
  
  var skillList = charXML.eveapi.result.rowset[skills_indx].getElements("row");		
  
  var return_array = [];	
  for(var skill_row = 0; skill_row < skillList.length; skill_row++)
  {
    
    var skillID = Number(skillList[skill_row].getAttribute("typeid").getValue());
    var skill_lvl = Number(skillList[skill_row].getAttribute("level").getValue());
    
    var tmp_row = [];
    var groupID = 0
    if (skillID in skill_name_lookup)
      tmp_row.push(skill_name_lookup[skillID]);
    else
      continue;
    tmp_row.push(skill_lvl);
    if (skillID in skill_group_lookup)
      groupID = skill_group_lookup[skillID];
    else
      continue;
    
    if		(groupID == 268 && production_skills)
      return_array.push(tmp_row);
    else if (groupID == 270 && science_skills)
      return_array.push(tmp_row);
    else if (groupID == 1218 && refining_skills)
      return_array.push(tmp_row);
  }
  return return_array;
}

function getAvgVolume(days,item_id,region_id)
{
  var market_obj = {};
  market_obj = __fetchCrest_market(region_id,item_id);
  
  var date_range = [];
  date_range = date_array(days);
  
  var volumes = 0;
  for (var index = 0; index < market_obj["items"].length; index ++)
  {
    var API_date = market_obj["items"][index]["date"];
    for (var indx2 = 0; indx2 < date_range.length; indx2++)
    {
      if (date_range[indx2] == API_date)
      {
        volumes += market_obj["items"][index]["volume"];
        break;				
      }
    }
    
  }
  
  return volumes/days;
}

function group_getAvgVolume(days,item_id_list,region_id)
{
  var return_list = [];
  var item_list = new Array();
  item_id_list.forEach (function(row){
    row.forEach (function(cell){
      if(typeof(cell) === 'number'){
        item_list.push(cell);
      }
    });
  });
  var cleanTypeIds = new Array();
  cleanTypeIds = item_list.filter(function(v,i,a) {
    return a.indexOf(v)===i;
  });
  
  for (var index=0; index < cleanTypeIds.length; index++)
  {
    var avgVol = getAvgVolume(days,cleanTypeIds[index],region_id)
    return_list.push(avgVol)
    //Utilities.sleep(100)
  }
  
  return return_list
}

function getVolumes(days,item_id,region_id)
{
  var market_obj = {};
  market_obj = __fetchCrest_market(region_id,item_id);
  
  var date_range = [];
  date_range = date_array(days);
  
  var volumes = [];
  for (var index = 0; index < market_obj["items"].length; index ++)
  {
    var API_date = market_obj["items"][index]["date"];
    for (var indx2 = 0; indx2 < date_range.length; indx2++)
    {
      if (date_range[indx2] == API_date)
      {
        volumes.push(market_obj["items"][index]["volume"]);
        break;				
      }
    }
    
  }
  
  return volumes;
}

function group_getAvgPrices(days,item_id_list,region_id,reverse_bool)
{
  var return_list	=[]
  var item_list = new Array();
  item_id_list.forEach (function(row){
    row.forEach (function(cell){
      if(typeof(cell) === 'number'){
        item_list.push(cell);
      }
    });
  });
  var cleanTypeIds = new Array();
  cleanTypeIds = item_list.filter(function(v,i,a) {
    return a.indexOf(v)===i;
  });
  for(var index=0; index < cleanTypeIds.length; index++)
  {
    var tmp_list = getAvgPrices(days,cleanTypeIds[index],region_id,reverse_bool)
    return_list.push(tmp_list)
    //Utilities.sleep(100)
  }
  return return_list
}

function getAvgPrices(days,item_id,region_id,reverse_bool)
{
  var market_obj = {};
  market_obj = __fetchCrest_market(region_id,item_id);
  
  var date_range = [];
  date_range = date_array(days);
  
  var prices = [];
  for (var index = 0; index < market_obj["items"].length; index ++)
  {
    var API_date = market_obj["items"][index]["date"];
    for (var indx2 = 0; indx2 < date_range.length; indx2++)
    {
      if (date_range[indx2] == API_date)
      {
        prices.push(market_obj["items"][index]["avgPrice"]);
        break;				
      }
    }
    
  }
  
  if (reverse_bool)
  {
    var rev_prices = [];
    for (var index = prices.length; index > 0; index --)
    {
      rev_prices.push(prices[index-1]);
    }
    
    prices = rev_prices;
  }
  return prices;
}

function AllItemPrices(header_bool, test_server)
{
  var market_prices_obj = {};
  
  market_prices_obj = __fetchMarketPrices(test_server);
  var return_array = [];
  
  if (header_bool)
  {
    var header = [];
    header = ["TypeName","TypeID","adjustedPrice","averagePrice"];
    return_array.push(header);
  }
  
  for (var index = 0; index < market_prices_obj["items"].length; index ++)
  { 
    priceLine = []
    priceLine.push(market_prices_obj["items"][index]["type"]["name"]);
    priceLine.push(Number(market_prices_obj["items"][index]["type"]["id"]));
    priceLine.push(Number(market_prices_obj["items"][index]["adjustedPrice"]));
    priceLine.push(Number(market_prices_obj["items"][index]["averagePrice"]));
    
    return_array.push(priceLine);
  }
  
  return return_array;
}

function AllSystemIndexes(header_bool, test_server)
{
  var system_index_obj = {};
  
  system_index_obj = __fetchSystemIndexes(test_server);
  var return_array = [];
  
  if (header_bool)
  {
    var header = [];
    header = ["SolarSystemName","SolarSystemID","Manufacturing","Copying","Invention","MaterialResearch","TimeResearch","ReverseEngineering"];
    return_array.push(header);
  }
  for (var index = 0; index < system_index_obj["items"].length; index ++)
  {
    var solarSystemName = system_index_obj["items"][index]["solarSystem"]["name"];
    var solarSystemID = Number(system_index_obj["items"][index]["solarSystem"]["id"]);
    
    var manufacturing	= 0;
    var copying 		= 0;
    var invention		= 0;
    var ME				= 0;
    var TE				= 0;
    var reverseEng		= 0;
    
    for (var cost_index = 0; cost_index < system_index_obj["items"][index]["systemCostIndices"].length; cost_index++)
    {
      
      var activityID = Number(system_index_obj["items"][index]["systemCostIndices"][cost_index]["activityID"]);
      var costIndex	= Number(system_index_obj["items"][index]["systemCostIndices"][cost_index]["costIndex"]);
      
      /*--Could replace with a costIndicies[activityID]=costIndex--*/
      if		(1 == activityID)
      {//Manufacturing
        manufacturing = costIndex;
      }
      else if (3 == activityID)
      {//Time Efficiency Research
        TE = costIndex;
      }
      else if (4 == activityID)
      {//Material Efficiency Research
        ME = costIndex;
      }
      else if (5 == activityID)
      {//Material Efficiency Research
        copying = costIndex;
      }
      else if (7 == activityID)
      {//Reverse Engineering
        reverseEng = costIndex;
      }
      else if (8 == activityID)
      {//Invention
        invention = costIndex;
      }
    }
    
    var systemLine = [];
    systemLine.push(solarSystemName);
    systemLine.push(solarSystemID);
    systemLine.push(manufacturing);
    systemLine.push(copying);
    systemLine.push(invention);
    systemLine.push(ME);
    systemLine.push(TE);
    systemLine.push(reverseEng);
    return_array.push(systemLine);
  }
  return return_array;
}

function fetch_EC_prices(priceIDs,locationID,header_keys,header_bool,buy_sell,price_volume,cachebuster){
  //Shamelessly stolen from https://github.com/fuzzysteve/eve-googledocs-script/blob/master/EveCentralPrices.gs
  //updated to suit average needs
  if (typeof locationID == 'undefined'){
    locationID=30000142;
  }
  if (typeof priceIDs == 'undefined'){
    throw 'need typeids';
  }
  if (typeof cachebuster == 'undefined'){
    cachebuster=1;
  }
  if (typeof header_bool == 'undefined'){
    header_bool=false;
  }
  if (typeof header_keys == 'undefined'){
    header_keys="typeid,buy_volume,buy_avg,buy_max,buy_min,buy_stddev,buy_median,buy_percentile,sell_volume,sell_avg,sell_max,sell_min,sell_stddev,sell_median,sell_percentile";
  }
  
  //BUILD HEADER//
  var header = [];
  var requested_header = header_keys.split(',');
  var typeid = false;
  var buy_volume, buy_avg, buy_max, buy_min, buy_stddev, buy_median, buy_percentile;
  var sell_volume, sell_avg, sell_max, sell_min, sell_stddev, sell_median, sell_percentile;
  
  buy_volume = buy_avg = buy_max = buy_min = buy_stddev = buy_median = buy_percentile = false;
  sell_volume = sell_avg = sell_max = sell_min = sell_stddev = sell_median = sell_percentile = false;
  //done badly to assure known order.	Rather than screwing with indexOf
  if (isInArray("typeid",requested_header)){
    header.push("typeid");
    typeid = true;
  };
  if (isInArray("buy_volume",requested_header)){
    header.push("buy_volume");
    buy_volume = true;
  };
  if (isInArray("buy_avg",requested_header)){
    header.push("buy_avg");
    buy_avg = true;
  };
  if (isInArray("buy_max",requested_header)){
    header.push("buy_max");
    buy_max = true;
  };
  if (isInArray("buy_min",requested_header)){
    header.push("buy_min");
    buy_min = true;
  };
  if (isInArray("buy_stddev",requested_header)){
    header.push("buy_stddev");
    buy_stddev = true;
  };
  if (isInArray("buy_median",requested_header)){
    header.push("buy_median");
    buy_median = true;
  };
  if (isInArray("buy_percentile",requested_header)){
    header.push("buy_percentile");
    buy_percentile = true;
  };
  if (isInArray("sell_volume",requested_header)){
    header.push("sell_volume");
    sell_volume = true;
  };
  if (isInArray("sell_avg",requested_header)){
    header.push("sell_avg");
    sell_avg = true;
  };
  if (isInArray("sell_max",requested_header)){
    header.push("sell_max");
    sell_max = true;
  };
  if (isInArray("sell_min",requested_header)){
    header.push("sell_min");
    sell_min = true;
  };
  if (isInArray("sell_stddev",requested_header)){
    header.push("sell_stddev");
    sell_stddev = true;
  };
  if (isInArray("sell_median",requested_header)){
    header.push("sell_median");
    sell_median = true;
  };
  if (isInArray("sell_percentile",requested_header)){
    header.push("sell_percentile");
    sell_percentile = true;
  };	
  //***---***//
  
  var location_key = '';
  var locationID_str = String(locationID);
  var locationType = Number(locationID_str.charAt(0));
  if(locationType == 1){
    location_key = '&regionlimit=';
  }
  else if (locationType == 3){
    location_key = '&usesystem=';
  }
  else if (locationType == 6){
    location_key = '&usestation=';
  }
  else{
    throw 'unsupported locationID';
  }
  
  var prices = new Array();
  var dirtyTypeIds = new Array();
  var cleanTypeIds = new Array();
  var url="http://api.eve-central.com/api/marketstat?cachebuster="+cachebuster+location_key+locationID+"&typeid=";
  priceIDs.forEach (function (row) {
    row.forEach ( function (cell) {
      if (typeof(cell) === 'number' ) {
        dirtyTypeIds.push(cell);
      }
    });
  });
  cleanTypeIds = dirtyTypeIds.filter(function(v,i,a) {
    return a.indexOf(v)===i;
  });
  var parameters = {method : "post", payload : ""};
  
  var o,j,temparray,chunk = 100;
  if(header_bool)
    prices.push(header);
  
  for (o=0,j=cleanTypeIds.length; o < j; o+=chunk) {
    temparray = cleanTypeIds.slice(o,o+chunk);
    var xmlFeed = UrlFetchApp.fetch(url+temparray.join("&typeid="), parameters).getContentText();
    var xml = XmlService.parse(xmlFeed);
    if(xml) {
      var rows=xml.getRootElement().getChild("marketstat").getChildren("type");
      for(var i = 0; i < rows.length; i++) {
        var price = [];
        if(typeid)
          price.push(parseInt(rows[i].getAttribute("id").getValue()));
        
        if(buy_volume)
          price.push(parseInt(rows[i].getChild("buy").getChild("volume").getValue()));
        if(buy_avg)
          price.push(parseFloat(rows[i].getChild("buy").getChild("avg").getValue()));
        if(buy_max)
          price.push(parseFloat(rows[i].getChild("buy").getChild("max").getValue()));
        if(buy_min)
          price.push(parseFloat(rows[i].getChild("buy").getChild("min").getValue()));
        if(buy_stddev)
          price.push(parseFloat(rows[i].getChild("buy").getChild("stddev").getValue()));
        if(buy_median)
          price.push(parseFloat(rows[i].getChild("buy").getChild("median").getValue()));
        if(buy_percentile)
          price.push(parseFloat(rows[i].getChild("buy").getChild("percentile").getValue()));
        
        if(sell_volume)
          price.push(parseInt(rows[i].getChild("sell").getChild("volume").getValue()));
        if(sell_avg)
          price.push(parseFloat(rows[i].getChild("sell").getChild("avg").getValue()));
        if(sell_max)
          price.push(parseFloat(rows[i].getChild("sell").getChild("max").getValue()));
        if(sell_min)
          price.push(parseFloat(rows[i].getChild("sell").getChild("min").getValue()));
        if(sell_stddev)
          price.push(parseFloat(rows[i].getChild("sell").getChild("stddev").getValue()));
        if(sell_median)
          price.push(parseFloat(rows[i].getChild("sell").getChild("median").getValue()));
        if(sell_percentile)
          price.push(parseFloat(rows[i].getChild("sell").getChild("percentile").getValue()));
        
        prices.push(price);			 
      }
    }
  }
  return prices;
}

var fuel_perhour_conv = {
  "12235":40,
  "12236":40,
  "16213":40,
  "16214":40,
  "20059":20,
  "20060":10,
  "20061":20,
  "20062":10,
  "20063":20,
  "20064":10,
  "20065":20,
  "20066":10,
  "27530":36,
  "27532":32,
  "27533":36,
  "27535":32,
  "27536":36,
  "27538":32,
  "27539":36,
  "27540":32,
  "27589":18,
  "27591":16,
  "27592": 9,
  "27594": 8,
  "27595":18,
  "27597":16,
  "27598": 9,
  "27600": 8,
  "27601":18,
  "27603":16,
  "27604": 9,
  "27606": 8,
  "27607":18,
  "27609":16,
  "27610": 9,
  "27612": 8,
  "27780":36,
  "27782":18,
  "27784": 9,
  "27786":32,
  "27788":16,
  "27790": 8
};
var stront_perhour_conv = {
  "12235":400,
  "12236":400,
  "16213":400,
  "16214":400,
  "20059":200,
  "20060":100,
  "20061":200,
  "20062":100,
  "20063":200,
  "20064":100,
  "20065":200,
  "20066":100,
  "27530":400,
  "27532":400,
  "27533":400,
  "27535":400,
  "27536":400,
  "27538":400,
  "27539":400,
  "27540":400,
  "27589":200,
  "27591":200,
  "27592":100,
  "27594":100,
  "27595":200,
  "27597":200,
  "27598":100,
  "27600":100,
  "27601":200,
  "27603":200,
  "27604":100,
  "27606":100,
  "27607":200,
  "27609":200,
  "27610":100,
  "27612":100,
  "27780":400,
  "27782":200,
  "27784":100,
  "27786":400,
  "27788":200,
  "27790":100
};
var POS_typeID_conv = {
  "12235":"Amarr Control Tower",
  "12236":"Gallente Control Tower",
  "16213":"Caldari Control Tower",
  "16214":"Minmatar Control Tower",
  "20059":"Amarr Control Tower Medium",
  "20060":"Amarr Control Tower Small",
  "20061":"Caldari Control Tower Medium",
  "20062":"Caldari Control Tower Small",
  "20063":"Gallente Control Tower Medium",
  "20064":"Gallente Control Tower Small",
  "20065":"Minmatar Control Tower Medium",
  "20066":"Minmatar Control Tower Small",
  "27530":"Blood Control Tower",
  "27532":"Dark Blood Control Tower",
  "27533":"Guristas Control Tower",
  "27535":"Dread Guristas Control Tower",
  "27536":"Serpentis Control Tower",
  "27538":"Shadow Control Tower",
  "27539":"Angel Control Tower",
  "27540":"Domination Control Tower",
  "27589":"Blood Control Tower Medium",
  "27591":"Dark Blood Control Tower Medium",
  "27592":"Blood Control Tower Small",
  "27594":"Dark Blood Control Tower Small",
  "27595":"Guristas Control Tower Medium",
  "27597":"Dread Guristas Control Tower Medium",
  "27598":"Guristas Control Tower Small",
  "27600":"Dread Guristas Control Tower Small",
  "27601":"Serpentis Control Tower Medium",
  "27603":"Shadow Control Tower Medium",
  "27604":"Serpentis Control Tower Small",
  "27606":"Shadow Control Tower Small",
  "27607":"Angel Control Tower Medium",
  "27609":"Domination Control Tower Medium",
  "27610":"Angel Control Tower Small",
  "27612":"Domination Control Tower Small",
  "27780":"Sansha Control Tower",
  "27782":"Sansha Control Tower Medium",
  "27784":"Sansha Control Tower Small",
  "27786":"True Sansha Control Tower",
  "27788":"True Sansha Control Tower Medium",
  "27790":"True Sansha Control Tower Small"
};
var skill_name_lookup = {
  3300:"Gunnery",
  3301:"Small Hybrid Turret",
  3302:"Small Projectile Turret",
  3303:"Small Energy Turret",
  3304:"Medium Hybrid Turret",
  3305:"Medium Projectile Turret",
  3306:"Medium Energy Turret",
  3307:"Large Hybrid Turret",
  3308:"Large Projectile Turret",
  3309:"Large Energy Turret",
  3310:"Rapid Firing",
  3311:"Sharpshooter",
  3312:"Motion Prediction",
  3315:"Surgical Strike",
  3316:"Controlled Bursts",
  3317:"Trajectory Analysis",
  11082:"Small Railgun Specialization",
  11083:"Small Beam Laser Specialization",
  11084:"Small Autocannon Specialization",
  12201:"Small Artillery Specialization",
  12202:"Medium Artillery Specialization",
  12203:"Large Artillery Specialization",
  12204:"Medium Beam Laser Specialization",
  12205:"Large Beam Laser Specialization",
  12206:"Medium Railgun Specialization",
  12207:"Large Railgun Specialization",
  12208:"Medium Autocannon Specialization",
  12209:"Large Autocannon Specialization",
  12210:"Small Blaster Specialization",
  12211:"Medium Blaster Specialization",
  12212:"Large Blaster Specialization",
  12213:"Small Pulse Laser Specialization",
  12214:"Medium Pulse Laser Specialization",
  12215:"Large Pulse Laser Specialization",
  20327:"Capital Energy Turret",
  21666:"Capital Hybrid Turret",
  21667:"Capital Projectile Turret",
  22043:"Tactical Weapon Reconfiguration",
  24563:"Doomsday Operation",
  3319:"Missile Launcher Operation",
  3320:"Rockets",
  3321:"Light Missiles",
  3322:"Auto-Targeting Missiles",
  3323:"Defender Missiles",
  3324:"Heavy Missiles",
  3325:"Torpedoes",
  3326:"Cruise Missiles",
  12441:"Missile Bombardment",
  12442:"Missile Projection",
  20209:"Rocket Specialization",
  20210:"Light Missile Specialization",
  20211:"Heavy Missile Specialization",
  20212:"Cruise Missile Specialization",
  20213:"Torpedo Specialization",
  20312:"Guided Missile Precision",
  20314:"Target Navigation Prediction",
  20315:"Warhead Upgrades",
  21071:"Rapid Launch",
  21668:"Citadel Torpedoes",
  25718:"Heavy Assault Missile Specialization",
  25719:"Heavy Assault Missiles",
  28073:"Bomb Deployment",
  32435:"Citadel Cruise Missiles",
  3184:"ORE Industrial",
  3327:"Spaceship Command",
  3328:"Gallente Frigate",
  3329:"Minmatar Frigate",
  3330:"Caldari Frigate",
  3331:"Amarr Frigate",
  3332:"Gallente Cruiser",
  3333:"Minmatar Cruiser",
  3334:"Caldari Cruiser",
  3335:"Amarr Cruiser",
  3336:"Gallente Battleship",
  3337:"Minmatar Battleship",
  3338:"Caldari Battleship",
  3339:"Amarr Battleship",
  3340:"Gallente Industrial",
  3341:"Minmatar Industrial",
  3342:"Caldari Industrial",
  3343:"Amarr Industrial",
  3344:"Gallente Titan",
  3345:"Minmatar Titan",
  3346:"Caldari Titan",
  3347:"Amarr Titan",
  12092:"Interceptors",
  12093:"Covert Ops",
  12095:"Assault Frigates",
  12096:"Logistics",
  12098:"Interdictors",
  16591:"Heavy Assault Cruisers",
  17940:"Mining Barge",
  19719:"Transport Ships",
  20342:"Advanced Spaceship Command",
  20524:"Amarr Freighter",
  20525:"Amarr Dreadnought",
  20526:"Caldari Freighter",
  20527:"Gallente Freighter",
  20528:"Minmatar Freighter",
  20530:"Caldari Dreadnought",
  20531:"Gallente Dreadnought",
  20532:"Minmatar Dreadnought",
  20533:"Capital Ships",
  22551:"Exhumers",
  22761:"Recon Ships",
  23950:"Command Ships",
  24311:"Amarr Carrier",
  24312:"Caldari Carrier",
  24313:"Gallente Carrier",
  24314:"Minmatar Carrier",
  28374:"Capital Industrial Ships",
  28609:"Heavy Interdiction Cruisers",
  28615:"Electronic Attack Ships",
  28656:"Black Ops",
  28667:"Marauders",
  29029:"Jump Freighters",
  29637:"Industrial Command Ships",
  30650:"Amarr Strategic Cruiser",
  30651:"Caldari Strategic Cruiser",
  30652:"Gallente Strategic Cruiser",
  30653:"Minmatar Strategic Cruiser",
  32918:"Mining Frigate",
  33091:"Amarr Destroyer",
  33092:"Caldari Destroyer",
  33093:"Gallente Destroyer",
  33094:"Minmatar Destroyer",
  33095:"Amarr Battlecruiser",
  33096:"Caldari Battlecruiser",
  33097:"Gallente Battlecruiser",
  33098:"Minmatar Battlecruiser",
  33856:"Expedition Frigates",
  34327:"ORE Freighter",
  34390:"Amarr Tactical Destroyer",
  3348:"Leadership",
  3349:"Skirmish Warfare",
  3350:"Siege Warfare",
  3351:"Siege Warfare Specialist",
  3352:"Information Warfare Specialist",
  3354:"Warfare Link Specialist",
  11569:"Armored Warfare Specialist",
  11572:"Skirmish Warfare Specialist",
  11574:"Wing Command",
  20494:"Armored Warfare",
  20495:"Information Warfare",
  22536:"Mining Foreman",
  22552:"Mining Director",
  24764:"Fleet Command",
  3363:"Corporation Management",
  3368:"Diplomatic Relations",
  3373:"Starbase Defense Management",
  3731:"Megacorp Management",
  3732:"Empire Control",
  11584:"Anchoring",
  12241:"Sovereignty",
  3380:"Industry",
  3387:"Mass Production",
  3388:"Advanced Industry",
  3395:"Advanced Small Ship Construction",
  3396:"Advanced Industrial Ship Construction",
  3397:"Advanced Medium Ship Construction",
  3398:"Advanced Large Ship Construction",
  3400:"Outpost Construction",
  22242:"Capital Ship Construction",
  24268:"Supply Chain Management",
  24625:"Advanced Mass Production",
  26224:"Drug Manufacturing",
  26252:"Jury Rigging",
  26253:"Armor Rigging",
  26254:"Astronautics Rigging",
  26255:"Drones Rigging",
  26256:"Electronic Superiority Rigging",
  26257:"Projectile Weapon Rigging",
  26258:"Energy Weapon Rigging",
  26259:"Hybrid Weapon Rigging",
  26260:"Launcher Rigging",
  26261:"Shield Rigging",
  3402:"Science",
  3403:"Research",
  3406:"Laboratory Operation",
  3408:"Sleeper Encryption Methods",
  3409:"Metallurgy",
  11433:"High Energy Physics",
  11441:"Plasma Physics",
  11442:"Nanite Engineering",
  11443:"Hydromagnetic Physics",
  11444:"Amarr Starship Engineering",
  11445:"Minmatar Starship Engineering",
  11446:"Graviton Physics",
  11447:"Laser Physics",
  11448:"Electromagnetic Physics",
  11449:"Rocket Science",
  11450:"Gallente Starship Engineering",
  11451:"Nuclear Physics",
  11452:"Mechanical Engineering",
  11453:"Electronic Engineering",
  11454:"Caldari Starship Engineering",
  11455:"Quantum Physics",
  11487:"Astronautic Engineering",
  11529:"Molecular Engineering",
  12179:"Research Project Management",
  20433:"Talocan Technology",
  21789:"Sleeper Technology",
  21790:"Caldari Encryption Methods",
  21791:"Minmatar Encryption Methods",
  23087:"Amarr Encryption Methods",
  23121:"Gallente Encryption Methods",
  23123:"Takmahl Technology",
  23124:"Yan Jung Technology",
  24270:"Scientific Networking",
  24624:"Advanced Laboratory Operation",
  30324:"Defensive Subsystem Technology",
  30325:"Engineering Subsystem Technology",
  30326:"Electronic Subsystem Technology",
  30327:"Offensive Subsystem Technology",
  30788:"Propulsion Subsystem Technology",
  3427:"Electronic Warfare",
  3433:"Sensor Linking",
  3434:"Weapon Disruption",
  3435:"Propulsion Jamming",
  4411:"Target Breaker Amplification",
  11579:"Cloaking",
  19759:"Long Distance Jamming",
  19760:"Frequency Modulation",
  19761:"Signal Dispersion",
  19766:"Signal Suppression",
  19767:"Turret Destabilization",
  19921:"Target Painting",
  19922:"Signature Focusing",
  27906:"Tactical Logistics Reconfiguration",
  27911:"Projected Electronic Counter Measures",
  3436:"Drones",
  3437:"Drone Avionics",
  3438:"Mining Drone Operation",
  3439:"Repair Drone Operation",
  3440:"Salvage Drone Operation",
  3441:"Heavy Drone Operation",
  3442:"Drone Interfacing",
  12305:"Drone Navigation",
  12484:"Amarr Drone Specialization",
  12485:"Minmatar Drone Specialization",
  12486:"Gallente Drone Specialization",
  12487:"Caldari Drone Specialization",
  23069:"Fighters",
  23566:"Advanced Drone Avionics",
  23594:"Sentry Drone Interfacing",
  23606:"Drone Sharpshooting",
  23618:"Drone Durability",
  24241:"Light Drone Operation",
  24613:"Advanced Drone Interfacing",
  32339:"Fighter Bombers",
  33699:"Medium Drone Operation",
  3443:"Trade",
  3444:"Retail",
  3446:"Broker Relations",
  3447:"Visibility",
  16594:"Procurement",
  16595:"Daytrading",
  16596:"Wholesale",
  16597:"Margin Trading",
  16598:"Marketing",
  16622:"Accounting",
  18580:"Tycoon",
  25233:"Corporation Contracting",
  25235:"Contracting",
  33467:"Customs Code Expertise",
  3449:"Navigation",
  3450:"Afterburner",
  3451:"Fuel Conservation",
  3452:"Acceleration Control",
  3453:"Evasive Maneuvering",
  3454:"High Speed Maneuvering",
  3455:"Warp Drive Operation",
  3456:"Jump Drive Operation",
  4385:"Micro Jump Drive Operation",
  21603:"Cynosural Field Theory",
  21610:"Jump Fuel Conservation",
  21611:"Jump Drive Calibration",
  24562:"Jump Portal Generation",
  3355:"Social",
  3356:"Negotiation",
  3357:"Diplomacy",
  3358:"Fast Talk",
  3359:"Connections",
  3361:"Criminal Connections",
  3893:"Mining Connections",
  3894:"Distribution Connections",
  3895:"Security Connections",
  3416:"Shield Operation",
  3419:"Shield Management",
  3420:"Tactical Shield Manipulation",
  3422:"Shield Emission Systems",
  3425:"Shield Upgrades",
  11566:"Thermic Shield Compensation",
  12365:"EM Shield Compensation",
  12366:"Kinetic Shield Compensation",
  12367:"Explosive Shield Compensation",
  21059:"Shield Compensation",
  21802:"Capital Shield Operation",
  24571:"Capital Shield Emission Systems",
  3392:"Mechanics",
  3393:"Repair Systems",
  3394:"Hull Upgrades",
  16069:"Remote Armor Repair Systems",
  21803:"Capital Repair Systems",
  22806:"EM Armor Compensation",
  22807:"Explosive Armor Compensation",
  22808:"Kinetic Armor Compensation",
  22809:"Thermic Armor Compensation",
  24568:"Capital Remote Armor Repair Systems",
  27902:"Remote Hull Repair Systems",
  27936:"Capital Remote Hull Repair Systems",
  32797:"Armor Resistance Phasing",
  33078:"Armor Layering",
  3428:"Long Range Targeting",
  3429:"Target Management",
  3430:"Advanced Target Management",
  3431:"Signature Analysis",
  32999:"Magnetometric Sensor Compensation",
  33000:"Gravimetric Sensor Compensation",
  33001:"Ladar Sensor Compensation",
  33002:"Radar Sensor Compensation",
  3318:"Weapon Upgrades",
  3413:"Power Grid Management",
  3417:"Capacitor Systems Operation",
  3418:"Capacitor Management",
  3421:"Energy Pulse Weapons",
  3423:"Capacitor Emission Systems",
  3424:"Energy Grid Upgrades",
  3426:"CPU Management",
  3432:"Electronics Upgrades",
  11207:"Advanced Weapon Upgrades",
  24572:"Capital Capacitor Emission Systems",
  28164:"Thermodynamics",
  28879:"Nanite Operation",
  28880:"Nanite Interfacing",
  3412:"Astrometrics",
  3551:"Survey",
  13278:"Archaeology",
  21718:"Hacking",
  25739:"Astrometric Rangefinding",
  25810:"Astrometric Pinpointing",
  25811:"Astrometric Acquisition",
  3385:"Reprocessing",
  3386:"Mining",
  3389:"Reprocessing Efficiency",
  3410:"Astrogeology",
  11395:"Deep Core Mining",
  12180:"Arkonor Processing",
  12181:"Bistot Processing",
  12182:"Crokite Processing",
  12183:"Dark Ochre Processing",
  12184:"Gneiss Processing",
  12185:"Hedbergite Processing",
  12186:"Hemorphite Processing",
  12187:"Jaspet Processing",
  12188:"Kernite Processing",
  12189:"Mercoxit Processing",
  12190:"Omber Processing",
  12191:"Plagioclase Processing",
  12192:"Pyroxeres Processing",
  12193:"Scordite Processing",
  12194:"Spodumain Processing",
  12195:"Veldspar Processing",
  12196:"Scrapmetal Processing",
  16281:"Ice Harvesting",
  18025:"Ice Processing",
  22578:"Mining Upgrades",
  25544:"Gas Cloud Harvesting",
  25863:"Salvaging",
  28585:"Industrial Reconfiguration",
  3405:"Biology",
  3411:"Cybernetics",
  24242:"Infomorph Psychology",
  24606:"Cloning Facility Operation",
  25530:"Neurotoxin Recovery",
  25538:"Neurotoxin Control",
  33399:"Infomorph Synchronizing",
  33407:"Advanced Infomorph Psychology",
  30532:"Amarr Defensive Systems",
  30536:"Amarr Electronic Systems",
  30537:"Amarr Offensive Systems",
  30538:"Amarr Propulsion Systems",
  30539:"Amarr Engineering Systems",
  30540:"Gallente Defensive Systems",
  30541:"Gallente Electronic Systems",
  30542:"Caldari Electronic Systems",
  30543:"Minmatar Electronic Systems",
  30544:"Caldari Defensive Systems",
  30545:"Minmatar Defensive Systems",
  30546:"Gallente Engineering Systems",
  30547:"Minmatar Engineering Systems",
  30548:"Caldari Engineering Systems",
  30549:"Caldari Offensive Systems",
  30550:"Gallente Offensive Systems",
  30551:"Minmatar Offensive Systems",
  30552:"Caldari Propulsion Systems",
  30553:"Gallente Propulsion Systems",
  30554:"Minmatar Propulsion Systems",
  2403:"Advanced Planetology",
  2406:"Planetology",
  2495:"Interplanetary Consolidation",
  2505:"Command Center Upgrades",
  13279:"Remote Sensing"
}
var skill_group_lookup = {
  3300:255,
  3301:255,
  3302:255,
  3303:255,
  3304:255,
  3305:255,
  3306:255,
  3307:255,
  3308:255,
  3309:255,
  3310:255,
  3311:255,
  3312:255,
  3315:255,
  3316:255,
  3317:255,
  11082:255,
  11083:255,
  11084:255,
  12201:255,
  12202:255,
  12203:255,
  12204:255,
  12205:255,
  12206:255,
  12207:255,
  12208:255,
  12209:255,
  12210:255,
  12211:255,
  12212:255,
  12213:255,
  12214:255,
  12215:255,
  20327:255,
  21666:255,
  21667:255,
  22043:255,
  24563:255,
  3319:256,
  3320:256,
  3321:256,
  3322:256,
  3323:256,
  3324:256,
  3325:256,
  3326:256,
  12441:256,
  12442:256,
  20209:256,
  20210:256,
  20211:256,
  20212:256,
  20213:256,
  20312:256,
  20314:256,
  20315:256,
  21071:256,
  21668:256,
  25718:256,
  25719:256,
  28073:256,
  32435:256,
  3184:257,
  3327:257,
  3328:257,
  3329:257,
  3330:257,
  3331:257,
  3332:257,
  3333:257,
  3334:257,
  3335:257,
  3336:257,
  3337:257,
  3338:257,
  3339:257,
  3340:257,
  3341:257,
  3342:257,
  3343:257,
  3344:257,
  3345:257,
  3346:257,
  3347:257,
  12092:257,
  12093:257,
  12095:257,
  12096:257,
  12098:257,
  16591:257,
  17940:257,
  19719:257,
  20342:257,
  20524:257,
  20525:257,
  20526:257,
  20527:257,
  20528:257,
  20530:257,
  20531:257,
  20532:257,
  20533:257,
  22551:257,
  22761:257,
  23950:257,
  24311:257,
  24312:257,
  24313:257,
  24314:257,
  28374:257,
  28609:257,
  28615:257,
  28656:257,
  28667:257,
  29029:257,
  29637:257,
  30650:257,
  30651:257,
  30652:257,
  30653:257,
  32918:257,
  33091:257,
  33092:257,
  33093:257,
  33094:257,
  33095:257,
  33096:257,
  33097:257,
  33098:257,
  33856:257,
  34327:257,
  34390:257,
  3348:258,
  3349:258,
  3350:258,
  3351:258,
  3352:258,
  3354:258,
  11569:258,
  11572:258,
  11574:258,
  20494:258,
  20495:258,
  22536:258,
  22552:258,
  24764:258,
  3363:266,
  3368:266,
  3373:266,
  3731:266,
  3732:266,
  11584:266,
  12241:266,
  3380:268,
  3387:268,
  3388:268,
  3395:268,
  3396:268,
  3397:268,
  3398:268,
  3400:268,
  22242:268,
  24268:268,
  24625:268,
  26224:268,
  26252:269,
  26253:269,
  26254:269,
  26255:269,
  26256:269,
  26257:269,
  26258:269,
  26259:269,
  26260:269,
  26261:269,
  3402:270,
  3403:270,
  3406:270,
  3408:270,
  3409:270,
  11433:270,
  11441:270,
  11442:270,
  11443:270,
  11444:270,
  11445:270,
  11446:270,
  11447:270,
  11448:270,
  11449:270,
  11450:270,
  11451:270,
  11452:270,
  11453:270,
  11454:270,
  11455:270,
  11487:270,
  11529:270,
  12179:270,
  20433:270,
  21789:270,
  21790:270,
  21791:270,
  23087:270,
  23121:270,
  23123:270,
  23124:270,
  24270:270,
  24624:270,
  30324:270,
  30325:270,
  30326:270,
  30327:270,
  30788:270,
  3427:272,
  3433:272,
  3434:272,
  3435:272,
  4411:272,
  11579:272,
  19759:272,
  19760:272,
  19761:272,
  19766:272,
  19767:272,
  19921:272,
  19922:272,
  27906:272,
  27911:272,
  3436:273,
  3437:273,
  3438:273,
  3439:273,
  3440:273,
  3441:273,
  3442:273,
  12305:273,
  12484:273,
  12485:273,
  12486:273,
  12487:273,
  23069:273,
  23566:273,
  23594:273,
  23606:273,
  23618:273,
  24241:273,
  24613:273,
  32339:273,
  33699:273,
  3443:274,
  3444:274,
  3446:274,
  3447:274,
  16594:274,
  16595:274,
  16596:274,
  16597:274,
  16598:274,
  16622:274,
  18580:274,
  25233:274,
  25235:274,
  33467:274,
  3449:275,
  3450:275,
  3451:275,
  3452:275,
  3453:275,
  3454:275,
  3455:275,
  3456:275,
  4385:275,
  21603:275,
  21610:275,
  21611:275,
  24562:275,
  3355:278,
  3356:278,
  3357:278,
  3358:278,
  3359:278,
  3361:278,
  3893:278,
  3894:278,
  3895:278,
  3416:1209,
  3419:1209,
  3420:1209,
  3422:1209,
  3425:1209,
  11566:1209,
  12365:1209,
  12366:1209,
  12367:1209,
  21059:1209,
  21802:1209,
  24571:1209,
  3392:1210,
  3393:1210,
  3394:1210,
  16069:1210,
  21803:1210,
  22806:1210,
  22807:1210,
  22808:1210,
  22809:1210,
  24568:1210,
  27902:1210,
  27936:1210,
  32797:1210,
  33078:1210,
  3428:1213,
  3429:1213,
  3430:1213,
  3431:1213,
  32999:1213,
  33000:1213,
  33001:1213,
  33002:1213,
  3318:1216,
  3413:1216,
  3417:1216,
  3418:1216,
  3421:1216,
  3423:1216,
  3424:1216,
  3426:1216,
  3432:1216,
  11207:1216,
  24572:1216,
  28164:1216,
  28879:1216,
  28880:1216,
  3412:1217,
  3551:1217,
  13278:1217,
  21718:1217,
  25739:1217,
  25810:1217,
  25811:1217,
  3385:1218,
  3386:1218,
  3389:1218,
  3410:1218,
  11395:1218,
  12180:1218,
  12181:1218,
  12182:1218,
  12183:1218,
  12184:1218,
  12185:1218,
  12186:1218,
  12187:1218,
  12188:1218,
  12189:1218,
  12190:1218,
  12191:1218,
  12192:1218,
  12193:1218,
  12194:1218,
  12195:1218,
  12196:1218,
  16281:1218,
  18025:1218,
  22578:1218,
  25544:1218,
  25863:1218,
  28585:1218,
  3405:1220,
  3411:1220,
  24242:1220,
  24606:1220,
  25530:1220,
  25538:1220,
  33399:1220,
  33407:1220,
  30532:1240,
  30536:1240,
  30537:1240,
  30538:1240,
  30539:1240,
  30540:1240,
  30541:1240,
  30542:1240,
  30543:1240,
  30544:1240,
  30545:1240,
  30546:1240,
  30547:1240,
  30548:1240,
  30549:1240,
  30550:1240,
  30551:1240,
  30552:1240,
  30553:1240,
  30554:1240,
  2403:1241,
  2406:1241,
  2495:1241,
  2505:1241,
  13279:1241
}
var POS_status = [
  "Unanchored",
  "Anchored - Offline",
  "Onlining",
  "Reinforced",
  "Online"
];

var fuelBlocks = [
  "4051",
  "4246",
  "4247",
  "4312"
];
var charters = [
  "24592",
  "24593",
  "24594",
  "24595",
  "24596",
  "24597"
];
var stront = 16275;
