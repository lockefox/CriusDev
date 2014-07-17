#!/Python27/python.exe

activity_conversion = {
	#activityID,activitySTR
	"0":"None",
	"1":"Manufacturing",
	"2":"DEV--Researching Technology",
	"3":"Researching Time Productivity",
	"4":"Researching Material Productivity",
	"5":"Copying",
	"6":"DEV--Duplicating",
	"7":"Reverse Engineering",
	"8":"Invention"
	}
class Blueprint:
	def __init__ (self):
		None
		activities = {}
		blueprintTypeID = 0
		maxProductionLimit = 1
		
	def json_parse(self,JSON_str):
		None
		
	def BOM(self,activity_index):	#overloading for ease of code
		bill_obj = self.bill_of_materials(activity_index)
		return bill_obj
		
	def bill_of_materials (self, activity_index):
		bill_obj = None
		return bill_obj
		
class Blueprint_activity:	##Make child of Blueprint?
	def __init__ (self):
		None
		activityID = 0
		activityName = ""
		skills = {}
		materials = {}	## materialID : quantity
		products = {} ##make pretty return function?
		time = 0
		
	def json_load(self,JSON_str):
		None
	
	def obj_load(self,obj):
		None
	
