var base_CREST_URL = "http://public-crest.eveonline.com/";
var test_CREST_URL = "http://public-crest-sisi.testeveonline.com/";
var base_API_URL = "https://api.eveonline.com/char/AssetList.xml.aspx?";

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

////	GDOC FUNCS		////
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