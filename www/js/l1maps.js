var globalRequest;
var closeEditFormAfterSuccess = true;
var globalMapsList;


function toggleEditMode() {
	document.getElementById('read-mode-button').style.display = 'none';
	document.getElementById('edit-mode-button').style.display = 'block';
	var coll = document.getElementsByClassName('edit_controls');
	for(var i = 0; i < coll.length; i++) {
        coll[i].style.display = 'inline';
    }
		
	return false;
}


function toggleReadMode() {
	document.getElementById('read-mode-button').style.display = 'block';
	document.getElementById('edit-mode-button').style.display = 'none';
	var coll = document.getElementsByClassName('edit_controls');
	for(var i = 0; i < coll.length; i++) {
        coll[i].style.display = 'none';
    }
		
	return false;
}


function jsonSchemeToTxt(jsonSchemeStr) {
	jsonScheme = JSON.parse(jsonSchemeStr);
	var txt = "";
	for (ind in jsonScheme) {
		txt += jsonScheme[ind] + "\r\n";
	}

	return txt;
}


function showMapUpdateForm(mapID) {
	showEmptyMapUpdateForm(false);

	for (i in globalMapsList) {
		for (j in globalMapsList[i]["maps"]) {
			if (globalMapsList[i]["maps"][j]["id"] == mapID) {
				document.getElementById('mapID').value = globalMapsList[i]["maps"][j]["id"];
				document.getElementById("mapGroup").options["select-option-group-" + globalMapsList[i]["maps"][j]["group_id"]].selected = true;
				document.getElementById('mapName').value = globalMapsList[i]["maps"][j]["name"];
				document.getElementById('mapScheme').value = jsonSchemeToTxt(globalMapsList[i]["maps"][j]["scheme"]);
			}
		}
	}
	
	return false;
}


function showEmptyMapUpdateForm(newMapMode=true) {
	clearMapError();
	if (newMapMode)
		document.getElementById('mapID').value = "0";
	
	mapsListHtml = "";
	for (i in globalMapsList) 
		mapsListHtml += "<option value='" + globalMapsList[i]["id"] + "' id='select-option-group-" + globalMapsList[i]["id"] + "'>" + globalMapsList[i]["group"]  + "</option>";
	document.getElementById('mapGroup').innerHTML = mapsListHtml;
	
	if (newMapMode) {
		document.getElementById('update-button').style.display = 'none';
		document.getElementById('map-update-form-caption').innerHTML = 'New map';
	}
	else {
		document.getElementById('update-button').style.display = 'inline';
		document.getElementById('map-update-form-caption').innerHTML = 'Edit map';
	}
	
	document.getElementById('map-update-form').style.display = 'block';

	return false;
}


function hideMapUpdateForm() {
	document.getElementById('map-update-form').style.display = 'none';
	document.getElementById('mapID').value = "";
	document.getElementById('mapGroup').value = "";
	document.getElementById('mapName').value = "";
	document.getElementById('mapScheme').value = "";		

	return false;
}


function showGroupUpdateForm(groupID) {
	showEmptyGroupUpdateForm(false);

	for (i in globalMapsList) {
		if (globalMapsList[i]["id"] == groupID) {
			document.getElementById('groupID').value = globalMapsList[i]["id"];
			document.getElementById('groupName').value = globalMapsList[i]["group"];
		}
	}

	return false;
}


function showEmptyGroupUpdateForm(newGroupMode=true) {
	clearGroupError();
	if (newGroupMode) {
		document.getElementById('groupID').value = "0";
		document.getElementById('group-update-form-caption').innerHTML = 'New group';
	}
	else {
		document.getElementById('group-update-form-caption').innerHTML = 'Edit group';
	}
		
	document.getElementById('group-update-form').style.display = 'block';
	
	return false;
}


function showGroupDeleteAlert(id) {
	document.getElementById('group-delete-alert').style.display = 'inline';
	document.getElementById('group-delete-button').innerHTML = "<input type='button' value='Delete' onclick='deleteGroup(" + id + ");'></input>";

	return false;
}


function hideGroupDeleteAlert() {
	document.getElementById('group-delete-alert').style.display = 'none';
	document.getElementById('group-delete-button').innerHTML = "";
	
	return false;
}


function hideGroupUpdateForm() {
	document.getElementById('group-update-form').style.display = 'none';
	document.getElementById('groupID').value = "";
	document.getElementById('groupName').value = "";

	return false;
}


function showMapError(text) {
	document.getElementById('map-error-message').innerHTML = "<p style='color: red;'>" + text + "</p>";
	document.getElementById('map-error-message').style.display = 'block';

	return false;
}


function showGroupError(text) {
	document.getElementById('group-error-message').innerHTML = "<p style='color: red;'>" + text + "</p>";
	document.getElementById('group-error-message').style.display = 'block';

	return false;
}

function clearMapError() {
	document.getElementById('map-error-message').innerHTML = "";
	document.getElementById('map-error-message').style.display = 'none';
}


function clearGroupError() {
	document.getElementById('group-error-message').innerHTML = "";
	document.getElementById('group-error-message').style.display = 'none';
}


function updateMap() {
	clearMapError();
	var id = document.getElementById('mapID').value;
	var group = document.getElementById('mapGroup').value;
	var name = document.getElementById('mapName').value.trim();
	var scheme = document.getElementById('mapScheme').value.trim();
	
	if (!name) {
		showMapError("Name can't be blank");
		return false;
	}
	
	if (!scheme) {
		showMapError("Scheme can't be blank");
		return false;
	}
	
	lines = scheme.split(/\r\n|\r|\n/);
	var jsonStr = "{";
	
	for (i=0; i < lines.length; i++) {
	
		patterns = lines[i].split(",");
		for (j=0; j < patterns.length; j++) {
			var pattern = patterns[j].trim();
			if (pattern.match(/\s|'|"\\|\/|&|`|@|#|%|\$|\^|\?|\*|\(|\)|\{|\}|\[|\]/)) {
				showMapError("Scheme error: unexpected symbol");
				return false;
			}
		}
		
		jsonStr += "\"" + (i+1) + "\": \"" + lines[i] + "\"";
		if (i != lines.length - 1)
			jsonStr += ", ";
	}
	
	jsonStr += "}";
	
	try {
		schemeJson = JSON.parse(jsonStr);
	}
	catch (e) {
		showMapError("Scheme error. " + e);
		return false;
	}
	
	try {
	  globalRequest = new XMLHttpRequest();
   } catch (e) {
	  try {
		 globalRequest = new ActiveXObject("Msxml2.XMLHTTP");
	  } catch (e) {
		 try {
			globalRequest = new ActiveXObject("Microsoft.XMLHTTP");
		 } catch (oc) {
			alert("No AJAX Support");
			return;
		 }
	  }
   }
   
   var body = 	"id=" + encodeURIComponent(id) + 
						"&group=" + encodeURIComponent(group) + 
						"&name=" + encodeURIComponent(name) +
						"&scheme=" + encodeURIComponent(jsonStr);

   globalRequest.onreadystatechange = processReqChange;
   globalRequest.open("POST", NTMAP_BACKEND_URI + "/updatemap", true);
   globalRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
   globalRequest.send(body);
   
   closeEditFormAfterSuccess = false;
   
   return false;
}


function updateMapAndClose() {
	updateMap();
	closeEditFormAfterSuccess = true;
}


function updateGroup() {
	clearGroupError();
	var id = document.getElementById('groupID').value;
	var name = document.getElementById('groupName').value.trim();
	
	if (!name) {
		showGroupError("Name can't be blank");
		return false;
	}
	
	try {
	  globalRequest = new XMLHttpRequest();
   } catch (e) {
	  try {
		 globalRequest = new ActiveXObject("Msxml2.XMLHTTP");
	  } catch (e) {
		 try {
			globalRequest = new ActiveXObject("Microsoft.XMLHTTP");
		 } catch (oc) {
			alert("No AJAX Support");
			return;
		 }
	  }
   }
   
   var body = 	"id=" + encodeURIComponent(id) + 
						"&name=" + encodeURIComponent(name);
						
   globalRequest.onreadystatechange = processGroupReqChange;
   globalRequest.open("POST", NTMAP_BACKEND_URI + "/updategroup", true);
   globalRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
   globalRequest.send(body);
   
   return false;
}


function updateGroupAndClose() {
	updateGroup();
}


function processReqChange() {
   // If globalRequest shows "complete"
   if (globalRequest.readyState == 4)
   {
	  // If "OK"
	  if (globalRequest.status == 200)
	  {
		 // Set current data text
		 var res = JSON.parse(globalRequest.responseText);
		 showMapError(res.result);
		 
		 if (res.result == "success")  {
			showMaps(true);
			
			if (closeEditFormAfterSuccess)
				hideMapUpdateForm();
		}
	 }
	  else
	  {
		 // Flag error
		 showMapError(globalRequest.responseText);
	  }
   }
}
			
			
function processGroupReqChange() {
   // If globalRequest shows "complete"
   if (globalRequest.readyState == 4)
   {
	  // If "OK"
	  if (globalRequest.status == 200)
	  {
		 // Set current data text
		 var res = JSON.parse(globalRequest.responseText);
		 showGroupError(res.result);
		 
		 if (res.result == "success")  {
			showMaps(true);
			hideGroupUpdateForm();
		}
	 }
	  else
	  {
		 // Flag error
		 showGroupError(globalRequest.responseText);
	  }
   }
}


function showMaps(edit_mode=false) {
	d3.json(NTMAP_BACKEND_URI + "/l1maps", function(error, mapsList) {
		if (error) throw error;

		if (mapsList.result != "success") {
			document.getElementById("error-message").innerHTML = mapsList.result;
			document.getElementById('error-message').style.display = "block";
			return null;
		}
		globalMapsList = mapsList["results"];
				
		mapsListHtml = "";
		for (i in globalMapsList) {
			mapsListHtml += "<h3 style='";
			if (i == 0)
				mapsListHtml += "margin-top: 0; ";
			mapsListHtml += "margin-bottom: 0;'><span style='padding-top: 2px; display: inline-block;'>" + globalMapsList[i]["group"] + "</span> &nbsp; <div style='display: none;' class='edit_controls'><a href='' onclick='return showGroupUpdateForm(" + globalMapsList[i]["id"] + ");'><svg height=16 width=16><image xlink:href=\"/img/edit.svg\" width=16 height=16></image></svg></a> <a href='' onclick='return showGroupDeleteAlert(" + globalMapsList[i]["id"] + ");'><svg height=16 width=16><image xlink:href=\"/img/delete.svg\" width=16 height=16></image></svg></a></div></h3><ul style='margin-left: 0; margin-bottom: 2em;'>";
			
			for (j in globalMapsList[i]["maps"])
				mapsListHtml += "<li style='margin-bottom: 0.4em;'><a href='/map/?id=" + globalMapsList[i]["maps"][j]["id"] + "' style='margin-top: 3px; display: inline-block;'>" + globalMapsList[i]["maps"][j]["name"] + "</a> &nbsp; <div style='display: none;' class='edit_controls'><a href='' onclick='return showMapUpdateForm(" + globalMapsList[i]["maps"][j]["id"] + ");'><svg height=16 width=16><image xlink:href=\"/img/edit.svg\" width=16 height=16></image></svg></a> <a href='#' onclick='return deleteMap(" + globalMapsList[i]["maps"][j]["id"] + ");'><svg height=16 width=16><image xlink:href=\"/img/delete.svg\" width=16 height=16></image></svg></a></div></li>";
			mapsListHtml += "</ul>";
		}
		mapsListHtml += "</ul><div style='display: none;' class='edit_controls'><a href='' onclick='return showEmptyGroupUpdateForm();'><svg height=16 width=84><image xlink:href=\"/img/newgroup.svg\" width=84 height=16></image></svg></a>&nbsp;&nbsp;";
		if (globalMapsList.length)
			mapsListHtml += "<a href='' onclick=\"return showEmptyMapUpdateForm();\"><svg height=16 width=77><image xlink:href=\"/img/newmap.svg\" width=77 height=16></image></svg></a>";
		mapsListHtml += "</div>";
		
		div = document.getElementById("maps-list");
		div.innerHTML = mapsListHtml;
		
		if (edit_mode)
			toggleEditMode();
		else
			toggleReadMode();
	});
}


function deleteMap(id) {
	d3.json(NTMAP_BACKEND_URI + "/deletemap?id=" + id, function(error, deleteResult) {
		if (error) throw error;
		showMaps(true);
	});
}


function deleteGroup(id) {
	d3.json(NTMAP_BACKEND_URI + "/deletegroup?id=" + id, function(error, deleteResult) {
		if (error) throw error;
		hideGroupDeleteAlert();
		showMaps(true);
	});
}


showMaps() ;
