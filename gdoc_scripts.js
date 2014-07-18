var base_CREST_URL = "http://public-crest.eveonline.com/";
var test_CREST_URL = "http://public-crest-sisi.testeveonline.com/";
var base_API_URL = "https://api.eveonline.com/char/AssetList.xml.aspx?";
var jobType ={};
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

function API_validateKey(keyID, vCode, expected_type, CAK_mask, test_server){
   //Takes API info and throws errors if bad
  
  var parameters = {
    method : "post",
    payload :
    "keyID=" + encodeURIComponent(keyID) +
    "&vCode=" + encodeURIComponent(vCode)
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
    throw "Invalid key type:" +  keytype + "Expected: " + expected_type;
  }

  if ((Number(accessMask) & CAK_mask) == 0){
    throw "Invalid access mask: " + accessMask + "Expected: " + CAK_mask; 
  }
  //make "EXPIRED" case
}
////	GDOC FUNCS		////
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
    "&vCode=" + encodeURIComponent(vCode)
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
    if (verbose_bool)	header.push("tax");
    
	/*--TODO: publish facility bonuses?--*/
    return_array.push(header);
  }
  
  var facName_conv = {};

  if(can_Locations)
  {//process whole list, and pull names all at once.
    var ID_list = "";
    for (var rowNum = 0; rowNum < facList.length; rowNum++)
    {//get all facility id's
      ID_list = ID_list+facList[rowNum].getAttribute("facilityid").getValue()+",";
    }
    facName_conv = getLocations(keyID, vCode, ID_list, API_addr, test_server);
  }
  
  for (var rowNum = 0; rowNum < facList.length; rowNum++)
  {
    var fac_line = [];
    
    var facID = facList[rowNum].getAttribute("facilityid").getValue();
    var facName = facName_conv[facID];
    
    if (verbose_bool)	fac_line.push(Number(facID));
    if (can_Locations)	fac_line.push(       facName);
    if (verbose_bool)	fac_line.push(Number(facList[rowNum].getAttribute("typeid").getValue()));
						fac_line.push(       facList[rowNum].getAttribute("typename").getValue());
    if (verbose_bool)	fac_line.push(Number(facList[rowNum].getAttribute("solarsystemid").getValue()));
						fac_line.push(       facList[rowNum].getAttribute("solarSystemName").getValue());
    if (verbose_bool)	fac_line.push(Number(facList[rowNum].getAttribute("regionid").getValue()));
						fac_line.push(       facList[rowNum].getAttribute("regionname").getValue());
    if (verbose_bool)	fac_line.push(Number(facList[rowNum].getAttribute("starbasemodifier").getValue()));
    if (verbose_bool)	fac_line.push(Number(facList[rowNum].getAttribute("tax").getValue()));
    
	/*--TODO: publish facility bonuses?--*/
    return_array.push(fac_line);
  }
  return return_array;
}

function getLocations(keyID, vCode, csv_ID_list, API_addr, test_server)
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
    "&IDs=" + encodeURIComponent(csv_ID_list)
  };
  Utilities.sleep(1000);
  
  if(test_server) API_addr = "https://api.testeveonline.com/";
  else API_addr = "https://api.eveonline.com/";
  
  var name_query = API_addr+"corp/Locations.xml.aspx?";
  var name_api = UrlFetchApp.fetch(name_query, parameters).getContentText();;
  var nameXML = Xml.parse(name_api,true);

  var nameList = nameXML.eveapi.result.rowset.getElements("row");
  
  for (var itemNum = 0; itemNum < nameList.length; itemNum ++)
  {
    var itemID   = nameList.getAttribute("itemid").getValue();
    var itemName = nameList.getAttribute("itemName").getValue();
    
    //NOTE: itemID is a string!!
    id_to_name[itemID] = itemName;
  }
  
  return id_to_name;
}
function getIndustryJobs(keyID, vCode, header_bool, verbose_bool, test_server)
{
  var personal_or_corp = 0;	//0=personal, 1=corp
  try{
    API_validateKey(keyID, vCode, "Account", 128, test_server);
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
		
		var activityID   = Number(jobList[jobNum].getAttribute("activityid").getValue());	
		var activityName = "";
		try{
			activityName = jobType_arr[activityID];
		}catch (err){
			activityName = "UKN ACTIVITYID";
		}
		//no smart casing, lower case only for attribute ID's//
		if (verbose_bool)	job_line.push(Number(jobList[jobNum].getAttribute("jobid").getValue()));
		if (verbose_bool)	job_line.push(Number(jobList[jobNum].getAttribute("installerid").getValue()));
							job_line.push(		 jobList[jobNum].getAttribute("installername").getValue());
							job_line.push(Number(jobList[jobNum].getAttribute("facilityid").getValue()));
		if (verbose_bool)	job_line.push(Number(jobList[jobNum].getAttribute("solarsystemid").getValue()));
							job_line.push(		 jobList[jobNum].getAttribute("solarsystemname").getValue());
							job_line.push(Number(jobList[jobNum].getAttribute("stationid").getValue()));
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
		
		var activityID = Number(system_index_obj["items"][index]["systemCostIndices"][cost_index]["activityID"]);
		var costIndex  = Number(system_index_obj["items"][index]["systemCostIndices"][cost_index]["costIndex"]);
      
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
