var base_CREST_URL = "http://public-crest.eveonline.com/";
var test_CREST_URL = "http://public-crest-sisi.testeveonline.com/";
var base_API_URL = "https://api.eveonline.com/char/AssetList.xml.aspx?";
var jobType ={};
JobType = {"1":"Manufacturing",
		"3":"Researching Time Efficiency",
		"4":"Researching Material Efficiency",
		"5":"Copying",
		"7":"Reverse Engineering",
		"8":"Invention"}
////	UTILITIES	////
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

////	FETCH FUNCS		////
function __fetchCrest_market(region_id,item_id)
{
  var parameters = {
    method : "get",
    user_agent : "Lockefox @HLIBindustry GDOC scripts",
  }
  var url = base_CREST_URL+"market/"+region_id+"/types/"+item_id+"/history/"
  Utilities.sleep(1000);
  var text = UrlFetchApp.fetch(url,parameters);
  var json_obj = JSON.parse(text);
  
  return json_obj;
  var valid_dates = []
  valid_dates = date_array(15);
  
  var volumes = []
}

function __fetchSystemIndexes(test_server)
{
  var base_url="";
  
  if(test_server) base_url = test_CREST_URL;
  else base_url = base_CREST_URL;
//  if(test_server === undefined) base_url = base_CREST_URL; //allow switching between test/live server (for debug)
//  else base_url = test_CREST_URL;
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
//  if(test_server === undefined) base_url = base_CREST_URL; //allow switching between test/live server (for debug)
//  else base_url = test_CREST_URL;
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

function API_validateKey(keyID, vCode, expected_type, CAK_mask){
   //Takes API info and throws errors if bad
  
  var parameters = {
      method : "post",
      payload :
      "keyID=" + encodeURIComponent(keyID) +
      "&vCode=" + encodeURIComponent(vCode)
   };
  try{//generic query error
      Utilities.sleep(1000);
    var info = UrlFetchApp.fetch("https://api.eveonline.com/account/APIKeyInfo.xml.aspx",parameters).getContentText();
  }catch (e){
    throw e;
  }
  var infoXML = Xml.parse(info,true);
  var accessMask = infoXML.eveapi.result.key.getAttribute("accessmask").getValue();
  var keytype = infoXML.eveapi.result.key.getAttribute("type").getValue();

  
  if (keytype != expected_type){
    throw "Invalid key type:" +  keytype + "Expected: " + expected_type;
  }
  if ((Number(accessMask) & CAK_mask) == 0){
    throw "Invalid access mask: " + accessMask + "Expected: " + CAK_mask; 
  }
  //make "EXPIRED" case
}

function getAttribute(thing, attribute_name)
{
	return thing.getAttribute(attribute_name).getValue();
}

function getAttributeNumber(thing, attribute_name)
{
	return Number(getAttribute(thing, attribute_name));
}

////	GDOC FUNCS		////
function getIndustryJobs(keyID, vCode, header_bool, verbose_bool, test_server)
{
	var personal_or_corp = 0;	//0=personal, 1=corp
	try{
		API_validateKey(keyID, vCode, "Account", 128);
	}catch(err){
		personal_or_corp = 1;
		try{
		API_validateKey(keyID, vCode, "Corporation", 128);
		}catch(badkey){
			return badkey;
		}
	}
////SET UP ADDRESS CALL////	
	parameters = {
    method : "post",
    payload :
    "keyID=" + encodeURIComponent(keyID) +
    "&vCode=" + encodeURIComponent(vCode)
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
	
	var job_api = UrlFetchApp.fetch(API_addr+call_mod+"/IndustryJobs.xml.aspx", parameters);
	var jobXML = Xml.parse(job_api,true);
	var jobList = jobXML.eveapi.result.rowset.getElements("row");
	
	var return_array = [];
	if(header_bool)
	{
		var header = []
		if (verbose_bool)	header.push("jobID");
		if (verbose_bool)	header.push("installerID");
							header.push("installerName");
							header.push("facilityID");
		if (verbose_bool)	header.push("solarSystemID");
							header.push("solarSystemName");
							header.push("stationID");
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
	for (var jobNum = 0; jobNum < jobList.length; jobNum++)
	{
		job_line = [];
		
		var activityID   = jobList[jobNum].getAttribute("activityID").getValue();	
		var activityName = "";
		try{
			activityName = jobType[activityID];
		}catch (err){
			activityName = "UKN ACTIVITYID";
		}
		var job = jobList[jobNum];
		if (verbose_bool)	job_line.push(getAttributeNumber(job, "jobID"));
		if (verbose_bool)	job_line.push(getAttributeNumber(job, "installerID"));
					job_line.push(getAttribute(job, "installerName"));
					job_line.push(getAttributeNumber(job, "facilityID"));
		if (verbose_bool)	job_line.push(getAttributeNumber(job, "solarSystemID"));
					job_line.push(getAttribute(job, "solarSystemName"));
					job_line.push(getAttributeNumber(job, "stationID"));
		/*------------*/
		if (verbose_bool)	job_line.push(Number(activityID));				
					job_line.push(activityName);
		/*------------*/					
		if (verbose_bool)	job_line.push(getAttributeNumber(job, "blueprintID"));
					job_line.push(getAttributeNumber(job, "blueprintTypeID"));
					job_line.push(getAttribute(job, "blueprintTypeName"));
		if (verbose_bool)	job_line.push(getAttributeNumber(job, "blueprintLocationID"));						
		if (verbose_bool)	job_line.push(getAttributeNumber(job, "outputLocationID"));
					job_line.push(getAttributeNumber(job, "runs"));
					job_line.push(getAttributeNumber(job, "cost"));
					job_line.push(getAttributeNumber(job, "teamID"));
		if (verbose_bool)	job_line.push(getAttributeNumber(job, "licensedRuns"));	
		if (verbose_bool)	job_line.push(getAttributeNumber(job, "probability"));	
		if (verbose_bool)	job_line.push(getAttribute(job, "productTypeName"));
		/*TODO ID->STR*/	job_line.push(getAttributeNumber(job, "status"));
					job_line.push(getAttributeNumber(job, "timeInSeconds"));
					job_line.push(getAttribute(job, "startDate"));
					job_line.push(getAttribute(job, "endDate"));
		if (verbose_bool)	job_line.push(getAttribute(job, "pauseDate"));
		if (verbose_bool)	job_line.push(getAttribute(job, "completedDate"));
		if (verbose_bool)	job_line.push(getAttributeNumber(job, "completedCharacterID"));	
		
		return_array.push(job_line);
	}
	
	return return_array;
}

function getAvgVolume(days,item_id,region_id)
{
  var market_obj = {};
  market_obj = __fetchCrest_market(item_id,region_id);
  
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

function getVolumes(days,item_id,region_id)
{
  var market_obj = {};
  market_obj = __fetchCrest_market(item_id,region_id);
  
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

  return volumes;
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
		if		(1 == Number(system_index_obj["items"][index]["systemCostIndices"][cost_index]["activityID"]))
		{//Manufacturing
			manufacturing = Number(system_index_obj["items"][index]["systemCostIndices"][cost_index]["costIndex"]);
		}
		else if (3 == Number(system_index_obj["items"][index]["systemCostIndices"][cost_index]["activityID"]))
		{//Time Efficiency Research
			TE = Number(system_index_obj["items"][index]["systemCostIndices"][cost_index]["costIndex"]);
		}
		else if (4 == Number(system_index_obj["items"][index]["systemCostIndices"][cost_index]["activityID"]))
		{//Material Efficiency Research
			ME = Number(system_index_obj["items"][index]["systemCostIndices"][cost_index]["costIndex"]);
		}
		else if (5 == Number(system_index_obj["items"][index]["systemCostIndices"][cost_index]["activityID"]))
		{//Material Efficiency Research
			copying = Number(system_index_obj["items"][index]["systemCostIndices"][cost_index]["costIndex"]);
		}
		else if (7 == Number(system_index_obj["items"][index]["systemCostIndices"][cost_index]["activityID"]))
		{//Reverse Engineering
			reverseEng = Number(system_index_obj["items"][index]["systemCostIndices"][cost_index]["costIndex"]);
		}
		else if (8 == Number(system_index_obj["items"][index]["systemCostIndices"][cost_index]["activityID"]))
		{//Invention
			invention = Number(system_index_obj["items"][index]["systemCostIndices"][cost_index]["costIndex"]);
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
