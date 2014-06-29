#!/Python27/python.exe

import json

class Blueprint:
	def __init__ (self):
		None
		
	def json_parse(self,JSON_str):
		None
		
	def BOM(self,activity_index):	#overloading for ease of code
		bill_obj = self.bill_of_materials(activity_index)
		return bill_obj
		
	def bill_of_materials (self, activity_index):
		bill_obj = None
		return bill_obj