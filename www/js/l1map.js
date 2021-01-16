var globalGraph = {};
var globalSimulation;
var globalSVGimages = {};
var IMG_DIR = "/img/";

Object.entries(DEVICE_ROLES).forEach(([key, value]) => {
	DEVICE_ROLES[key] = IMG_DIR + value;
});


///////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////
function hideInfobox() {
	document.getElementById('infobox').style.display = 'none';
}


function OnClickDetails(node, interfaces=null) {
	if (node.class == "circuits")
		if (node.type == "provider")
			onClickProviderDetails(node);
		else 
			onClickCircuitDetails(node);
	else
		onClickDeviceDetails(node, interfaces);
}

function onClickProviderDetails(provider) {
	var infobox = document.getElementById('infobox');
	infobox.style.display = 'block';
	text  = "<img src='/img/pixel.png' width='600' height='1'/>";
	text += "<table width='100%'><tr><td>";
	text += "<h3 style='margin-bottom: 0.5em; margin-top: 1em;'><a target='_blank' href='" + NETBOX_URL + "/circuits/providers/" + provider.slug + "/'>";
	text += provider.id + "</a></h3>";
	text += "</td><td valign='top' align='right'><a href='#' onclick='hideInfobox(); return false;'><img src='/img/close.svg' width='16' height='16' style='margin-top: 1.2em;'></a></td></tr>";
	if (provider.asn)
		text += "<tr><td>ASN: " + provider.asn + "</td></tr>";
	text += "</table>";
	
	infobox.innerHTML = text;
	infobox.style.height = "150px";
	infobox.style.width = "300px";
}

function onClickCircuitDetails(circuit) {
	var infobox = document.getElementById('infobox');
	infobox.style.display = 'block';
	text  = "<img src='/img/pixel.png' width='600' height='1'/>";
	text += "<table width='100%'><tr><td>";
	text += "<h3 style='margin-bottom: 0.5em; margin-top: 1em;'><a target='_blank' href='" + NETBOX_URL + "/circuits/circuits/" + circuit.netbox_id + "/'>";
	text += circuit.id.slice(0, -2) + "</a> <span class='secondary_text'>Side " + circuit.id.slice(-1) + "</span></h3>";
	text += "</td><td valign='top' align='right'><a href='#' onclick='hideInfobox(); return false;'><img src='/img/close.svg' width='16' height='16' style='margin-top: 1.2em;'></a></td></tr>";
	text += "<tr><td>Provider: " + circuit.provider + "</td></tr>";
	text += "<tr><td>Type: " + circuit.circuit_type + "</td></tr>";
	if (circuit.commit_rate)
		text += "<tr><td>Commit Rate: " + getReadableBpsString(circuit.commit_rate) + "</td></tr>";
	text += "</table>";
	
	infobox.innerHTML = text;
	infobox.style.height = "150px";
	infobox.style.width = "300px";
}

function onClickDeviceDetails(device, interfaces) {
	var infobox = document.getElementById('infobox');
	infobox.style.display = 'block';
		
	text  = "<img src='/img/pixel.png' width='600' height='1'/>";
	text += "<table width='100%'><tr><td>";
	if (device.thisIsCollapsedVC)
		text += "<h3 style='margin-bottom: 0.5em; margin-top: 1em;'><a target='_blank' href='" + NETBOX_URL + "/dcim/virtual-chassis/" + device.netbox_id + "/'>";
	else
		text += "<h3 style='margin-bottom: 0.5em; margin-top: 1em;'><a target='_blank' href='" + NETBOX_URL + "/dcim/devices/" + device.netbox_id + "/'>";
	text += device.id + "</a></h3>";
	text += "</td><td valign='top' align='right'><a href='#' onclick='hideInfobox(); return false;'><img src='/img/close.svg' width='16' height='16' style='margin-top: 1.2em;'></a></td></tr></table>";
	
	if (device.thisIsCollapsedVC) {
		text += "<table id='infobox_vc_tab' style='cellspacing: 0; cellpadding: 0; border-collapse: collapse; overflow: auto; display: inline-block;'>";
		if (device.nodes.length > 2) { // print VC nodes in two columns if their number is big
			nodesInColumn = Math.ceil(device.nodes.length/2);
			for (i = 0; i < nodesInColumn; i++) {
				if (device.nodes[nodesInColumn + i]) {
					device2_position_in_vc = device.nodes[nodesInColumn + i].position_in_vc + ":";
					device2_manufacturer = device.nodes[nodesInColumn + i].manufacturer;
					device2_model = device.nodes[nodesInColumn + i].model;
					device2_serial = device.nodes[nodesInColumn + i].serial;
				}
				else
					device2_position_in_vc = device2_manufacturer = device2_model = device2_serial = "";
				text += "<tr><td>" + device.nodes[i].position_in_vc + ":&nbsp;</td><td>" + device.nodes[i].manufacturer + " " + device.nodes[i].model + "</td><td><img src='/img/pixel.png' width='40' height='1'></td><td>" + device2_position_in_vc + "&nbsp;</td><td>" + device2_manufacturer + " " + device2_model + "</td><td><img src='/img/pixel.png' width='20' height='1'></td></tr>";
				text += "<tr><td></td><td style='padding-bottom: 0.4em;'><span class='secondary_text'>" + device.nodes[i].serial + "</span></td><td></td><td></td><td style='padding-bottom: 0.4em;'><span class='secondary_text'>" + device2_serial + "</span></td></tr>";
			}

		}
		else { // small number of VC nodes can be printed in one coulumn
			for (i in device.nodes) {
				text += "<tr><td>" + device.nodes[i].position_in_vc + ":&nbsp;</td><td>" + device.nodes[i].manufacturer + " " + device.nodes[i].model + "</td><td><img src='/img/pixel.png' width='20' height='1'></td></tr>";
				text += "<tr><td></td><td style='padding-bottom: 0.4em;'><span class='secondary_text'>" + device.nodes[i].serial + "</span></td></tr>";
			}
		}
		text += "</table>";
	}
	else {
		text += "<p style='margin-top: 0;'>" + device.manufacturer + " "  + device.model + "<br/>";
		text += "<span class='secondary_text'>" + device.serial + "</span></p>";
	}
	
	text += "<p><b>Interfaces:</b></p>";
	text += "<table class='infobox_tab' id='infobox_tab'>";
	text += "<thead><tr> <th width='1%'><div>&nbsp;</div></th> <th width='1%'><div>Name</div></th> <th width='1%'><div>LAG</div></th> <th width='1%'><div>Connection</div></th> <th width='1%'><div></div></th> <th><div>Description</div></th> </tr></thead>";
	text += "<tbody>";
	
	for (i in interfaces) {
		text += "<tr valign='top' onmouseover='document.getElementById(\"speed-info-" + i + "\").style.opacity = 1;' onmouseout='document.getElementById(\"speed-info-" + i + "\").style.opacity = 0;'>";
		
		if (interfaces[i].speed == -1)
			sp = "?";
		else 
			sp = interfaces[i].speed;
		text += "<td class='link" + parseInt(interfaces[i].speed) + "gb-info' valign='middle' align='center' style='padding: 0;'><div style='opacity: 0;' class='link-speed-info' id='speed-info-" + i + "'>" + sp + "</div></td>";

		text += "<td nowrap><a target='_blank' href='" + NETBOX_URL + "/dcim/interfaces/" + interfaces[i].netbox_id + "/'>" + interfaces[i].name + "</a></td>";
			
		if (interfaces[i].hasOwnProperty("lag") && interfaces[i].lag)
			text += "<td nowrap><a target='_blank' href='" + NETBOX_URL + "/dcim/interfaces/" + interfaces[i].lag_netbox_id + "/'>" + interfaces[i].lag + "</a></td>";
		else
			text += "<td>&nbsp;</td>";

		if (interfaces[i].neighbor) {
			if (interfaces[i].neighbor_class == "circuits") {
				text += "<td class='secondary_text' nowrap><i class='fa fa-globe'></i> <a target='_blank' href='" + NETBOX_URL + "/circuits/providers/" + interfaces[i].neighbor_slug + "/' class='secondary_text'>" + interfaces[i].neighbor + "</a></td>";
				text += "<td class='secondary_text' nowrap><a target='_blank' href='" + NETBOX_URL + "/circuits/circuits/" + interfaces[i].neighbor_interface_netbox_id + "/' class='secondary_text'>" + interfaces[i].neighbor_interface + "</a></td>";
			}
			else {
				text += "<td class='secondary_text' nowrap><a target='_blank' href='" + NETBOX_URL + "/dcim/devices/" + interfaces[i].neighbor_netbox_id + "/' class='secondary_text'>" + interfaces[i].neighbor + "</a></td>";
				text += "<td class='secondary_text' nowrap><a target='_blank' href='" + NETBOX_URL + "/dcim/interfaces/" + interfaces[i].neighbor_interface_netbox_id + "/' class='secondary_text'>" + interfaces[i].neighbor_interface + "</a></td>";
			}
		}
		else
			text += "<td>&nbsp;</td><td>&nbsp;</td>"
		
		if (interfaces[i].description)
			text += "<td>" + interfaces[i].description + "</td>";
		else
			text += "<td>&nbsp;</td>";
			
		text += "</tr>";
	}
	
	text += "<tr class='last_tr'> <td><img src='/img/pixel.png' width='16' height='1'></td> <td><img src='/img/pixel.png' width='70' height='1'></td> <td><img src='/img/pixel.png' width='70' height='1'></td> <td><img src='/img/pixel.png' width='100' height='1'></td> <td><img src='/img/pixel.png' width='100' height='1'></td> <td><img src='/img/pixel.png' width='1' height='1'></td> </tr>";
	text += "</tbody></table>";
	
	infobox.innerHTML = text;
	
	// ajust height of VC table (if we have a big list of VC nodes) so that it fits infobox dimensions 
	// TODO: do it with pure CSS
	var infoboxVcTab = document.getElementById('infobox_vc_tab');
	
	if (infoboxVcTab) {
		if (infoboxVcTab.scrollHeight > 160) 
			infoboxVcTab.style.height = "160px";
	}
	// ajust height of interface table (if we have a big list of interfaces) so that it fits infobox dimensions 
	// TODO: do it with pure CSS
	var infoboxTab = document.getElementById('infobox_tab');
	
	infobox.style.height = "calc(100vh - 50px)";
	if ((infoboxTab.offsetTop + infoboxTab.scrollHeight) > (infobox.offsetTop + infobox.clientHeight)) 
		infoboxTab.style.height = (infobox.clientHeight - infoboxTab.offsetTop - 30) + "px";
	else 
		infobox.style.height = (infoboxTab.offsetTop + infoboxTab.clientHeight - infobox.offsetTop + 20) + "px";
	infobox.style.width = "700px";

}


function getReadableBpsString(speed) {
    var i = -1;
    var byteUnits = [' Mbps', ' Gbps', ' Tbps', 'Pbps', 'Ebps', 'Zbps', 'Ybps'];
    do {
        speed = speed / 1000;
        i++;
    } while (speed > 1000);

    if (parseFloat(Math.max(speed, 0.1).toFixed(1)) == parseFloat(Math.max(speed, 0.1).toFixed()))
    	return Math.max(speed, 0.1).toFixed() + byteUnits[i];
    else
    	return Math.max(speed, 0.1).toFixed(1) + byteUnits[i];
};


var getJSON = function(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.onload = function() {
      var status = xhr.status;
      if (status === 200) {
        callback(null, xhr.response);
      } else {
        callback(status, xhr.response);
      }
    };
    xhr.send();
};


function setCSSstyle(elem) {
	elem.style.background = window.getComputedStyle(elem, null).getPropertyValue("background");
	elem.style.fill = window.getComputedStyle(elem, null).getPropertyValue("fill");
	elem.style.stroke = window.getComputedStyle(elem, null).getPropertyValue("stroke");
	elem.style.strokeWidth = window.getComputedStyle(elem, null).getPropertyValue("stroke-width");
	elem.style.strokeDasharray = window.getComputedStyle(elem, null).getPropertyValue("stroke-dasharray");
	elem.style.font = window.getComputedStyle(elem, null).getPropertyValue("font");
	elem.style.fontSize = window.getComputedStyle(elem, null).getPropertyValue("font-size");
	/*elem.style.stroke-linejoin = window.getComputedStyle(elem, null).getPropertyValue("stroke-linejoin");
	elem.style.border-collapse = window.getComputedStyle(elem, null).getPropertyValue("border-collapse");
	*/
	
	/*if 	(elem.tagName == "text") {
		console.log(elem.tagName);
		console.log(elem.childNodes);
	}*/
	//console.log(elem.style.fill);

	let children = elem.childNodes;
	for(var i=0; i < children.length; i++) 
		if (children[i].nodeType == Node.ELEMENT_NODE)
			setCSSstyle(children[i]);
}


function enableSvgDownloadLink() {
	document.getElementById('svg_download_link').style.display = 'inline';
	document.getElementById('svg_download_link_placeholder').style.display = 'none';
}


function disableSvgDownloadLink() {
	document.getElementById('svg_download_link').style.display = 'none';
	document.getElementById('svg_download_link_placeholder').style.display = 'inline';
}


function generateSVGdownloadLink() {
	setCSSstyle(document.getElementById("svg1"));
	
	var svg1 = document.getElementById("svg1"); // get svg element
	var serializer = new XMLSerializer(); //get svg source
	var source = serializer.serializeToString(svg1);

	if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) // add name spaces
		source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
	if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/))
		source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
	source = '<?xml version="1.0" standalone="no"?>\r\n' + source; // add xml declaration
	
	//let tag = source.match(/<image.+?\/>/);
	while (tag = source.match(/<image.+?\/>/)) {
		tag = tag[0];
		let uri = tag.match(/href="(.+?)"/)[1];
		let imgFile = uri.match(/.*\/(.+)/)[1];
		let svgStr = "<g transform='translate(-16, -16)'>" + globalSVGimages[imgFile] + "</g>";
		source = source.replace(tag, svgStr);
	}
	
	var url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source); // convert svg source to URI data scheme
	document.getElementById("svg_download_link").href = url; // set URI value to download link's href attribute
	// a user can download SVG file by right click menu
}


function getDOMofSVGimages() {
	for (var type in Object(DEVICE_ROLES)) {
		var imgUrl = DEVICE_ROLES[type];
		
		d3.xml(imgUrl).mimeType("image/svg+xml").get(function(error, xml) {
			if (error) throw error;
			
			//console.log(xml.documentElement); // <svg>...</svg>
			//console.log(xml.documentElement.childNodes[1].baseURI); // <svg><g>...</g></svg>
			let filename = xml.documentElement.childNodes[1].baseURI.match(/[a-zA-Z]+\.svg/)[0];
			let s = new XMLSerializer();
			let str = s.serializeToString(xml.documentElement.childNodes[1]);
			globalSVGimages[filename] = str;
			//document.body.appendChild(xml.documentElement);
		});
	}
}


function getImgUrlForDevice(type, name=null) {
	if (!DEVICE_ROLES[type])
		return DEVICE_ROLES["Unknown"];
	// if (name && type.includes("Switch") && (name.includes("-mgmt") || name.includes("-mng") ))
		// return DEVICE_ROLES["Management Switch"];
	else
		return DEVICE_ROLES[type];
}


///////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////

function getL1Map() {
	document.getElementById('progressbar').style.display = 'block';
	mapid = getParameterByName("id");
	d3.json(NTMAP_BACKEND_URI + "/l1map?id=" + mapid, function(error, loadedGraphResults) {
		if (error) throw error;
		
		if (loadedGraphResults.result != "success") {
			document.getElementById('progressbar').style.display = "none";
			document.getElementById('error-message').innerHTML = loadedGraphResults.result;
			document.getElementById('error-message').style.display = "block";
		}
		else {	
			globalGraph = loadedGraphResults.results;
			drawL1Map(1, 1);
		}
	});
}


function drawL1Map() {
	// select display mode based on the position of radio buttons
	if (document.querySelector('input[name="radio_prod_links_mode"]:checked').value == 1)
		prodLinksMode = true;
	else
		prodLinksMode = false;

	if (document.querySelector('input[name="radio_expand_vc_mode"]:checked').value == 1)
		expandVirtChassisMode = true;
	else
		expandVirtChassisMode = false;
	
	if (!globalGraph.nodes) 
		return false;
	
	// stop simulation to prevent prod-mng switch artifacts
	if (globalSimulation)
		globalSimulation.stop();
		
	var graph = {};
	var graph = JSON.parse(JSON.stringify(globalGraph)); // TODO: check if this works fine for big data structures

	// initial svg height & width. Will be corrected later according to the number of elements on L1-map
	var svgHeight = 0; 
	var svgWidth  = (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) - 20;
	var COLLISION_RADIUS = 36;
	
	mapid = getParameterByName("id");
	// commented JSON read from file
	// d3.json("dc1.json", function(error, test_graph) {
		// if (error) throw error;
	// graph = test_graph.results;
	
	if (!prodLinksMode)
		graph.links = graph.mng_links;
	
	var vcDict = {};
	var nodesList = new Array();
	
	// Collapse virtual chassis to one node with comprising important properties of all members of VC 
	// Example: all links beloning to each member should now belong to the node wich represents the whole VC
	if (!expandVirtChassisMode) { 
		// Collapse virtual chassis, i.e. throw out all nodes in each VC except for one
		for (i in graph.nodes) {
			if (graph.nodes[i].hasOwnProperty("virtual_chassis_netbox_id") && graph.nodes[i].virtual_chassis_netbox_id) { // This is a VC node. It shouldn't be added to nodes list. Instead a VC node should be generated
				
				// if vcDict doesn't have this VC, add it to vcDict
				if (!vcDict[graph.nodes[i].virtual_chassis_netbox_id]) {
					vcDict[graph.nodes[i].virtual_chassis_netbox_id] = {"leftGroup": graph.nodes[i].group, "nodes": [] };
					
					// add this node to new nodesList with the name of VC
					firstNodeOfVC = Object.assign({}, graph.nodes[i]);
					firstNodeOfVC.id = graph.nodes[i].virtual_chassis;
					firstNodeOfVC.netbox_id = graph.nodes[i].virtual_chassis_netbox_id;
					firstNodeOfVC.serial = "";
					firstNodeOfVC.model = "";
					firstNodeOfVC.manufacturer = "";
					firstNodeOfVC.thisIsCollapsedVC = true;
					delete firstNodeOfVC["virtual_chassis"];
					delete firstNodeOfVC["virtual_chassis_netbox_id"];

					nodesList.push(firstNodeOfVC);
				}
				else { // node is in the vcDict
					// select left group of VC. That will display the collapsed-VC-node in the very left group
					if (graph.nodes[i].group < vcDict[graph.nodes[i].virtual_chassis_netbox_id]["leftGroup"]) 
						vcDict[graph.nodes[i].virtual_chassis_netbox_id].leftGroup = graph.nodes[i].group;
				}

				
				var nodeInfo = { 
					"serial": graph.nodes[i].serial, 
					"manufacturer": graph.nodes[i].manufacturer, 
					"model": graph.nodes[i].model,
					"position_in_vc": graph.nodes[i].position_in_vc
				};
				vcDict[graph.nodes[i].virtual_chassis_netbox_id].nodes.push(nodeInfo);
				
				// find all links of this node and change names of A and Z point in them
				for (j in graph.links) {
					if (graph.links[j].source === graph.nodes[i].id)
						graph.links[j].source = graph.nodes[i].virtual_chassis;
					if (graph.links[j].target === graph.nodes[i].id)
						graph.links[j].target = graph.nodes[i].virtual_chassis;
				}
				
				// find all interfaces of this node and assign them to VC collapsed node
				if (graph.interfaces[graph.nodes[i].id]) {
					if (!graph.interfaces[graph.nodes[i].virtual_chassis])
						graph.interfaces[graph.nodes[i].virtual_chassis] = Array();
					
					for (j in graph.interfaces[graph.nodes[i].id])
						graph.interfaces[graph.nodes[i].virtual_chassis].push(graph.interfaces[graph.nodes[i].id][j]);
						
					delete graph.interfaces[graph.nodes[i].id];
				}
			}
			else // It is not a VC node, add this node to new nodesList without changes
				nodesList.push(graph.nodes[i]);

		}

		// set serial and model for collapsed VC node to be the list of all VC members serials and models to be displayed in infobox
		for (i in nodesList) 
			if (nodesList[i].hasOwnProperty("thisIsCollapsedVC") && vcDict[nodesList[i].netbox_id]) {
				nodesList[i].nodes = vcDict[nodesList[i].netbox_id].nodes;
				nodesList[i].nodes.sort(compareVcNodes);
			}

		// for each link 
		// delete links between virtual_chassis members
		// find all links with the same A and Z and sum amount of them
		var linksList = new Array();
		
		for (i in graph.links) {
			// only consider links wich are not between VC members
			if (graph.links[i].source != graph.links[i].target) {
				var similarLinks = false;
				for (j in linksList) {
					// for similar links just increment counter
					if (graph.links[i].source === linksList[j].source && 
						graph.links[i].target === linksList[j].target &&
						graph.links[i].bandwidth === linksList[j].bandwidth) {
						similarLinks = true;
						linksList[j].quantity = parseInt(linksList[j].quantity) + parseInt(graph.links[i].quantity);
					}
				}
				
				// if no similar link found, add the link to the final array linksList
				if (!similarLinks) {
					goodLink = Object.assign({}, graph.links[i]);
					linksList.push(goodLink);
				}
			}
		}
		
		graph.nodes = nodesList;
		graph.links = linksList;
	}
	
	graph.nodes.sort(compareNodes);
	
	// From the list of nodes fill clustersArray = {id (human-readable name), nodes_amount (number of nodes in cluster)}, {}, {}... 
	// From the list of nodes fill vcArray = [numOfElmentsInGroup1, numOfElmentsInGroup2... etc]
	// From the list of nodes fill groupsArray = [numOfElmentsInGroup1, numOfElmentsInGroup2... etc]
	var clustersArray = new Array();
	var vcArray = new Array();
	var groupsArray = new Array();
	var nodesInLargestGroup = 0;

	for (i in graph.nodes) {
		// fill clustersArray
		if (graph.nodes[i].hasOwnProperty("cluster") && graph.nodes[i].cluster) {
			var nodeParentCluster = -1;
			
			for (var j = 0; j < clustersArray.length; j++) 
				if (clustersArray[j].id === graph.nodes[i].cluster) 
					nodeParentCluster = j;
			
			if (nodeParentCluster < 0) {
				clustersArray.push({
					"id" : graph.nodes[i].cluster,
					"nodes_amount": 1
				});
			}
			else
				clustersArray[nodeParentCluster].nodes_amount++;
		}

		// fill vcArray (applicable for VC expand mode)
		if (graph.nodes[i].hasOwnProperty("virtual_chassis") && graph.nodes[i].virtual_chassis) {
			var parentVC = -1;
			
			for (var j = 0; j < vcArray.length; j++) 
				if (vcArray[j].id === graph.nodes[i].virtual_chassis) 
					parentVC = j;
			
			if (parentVC < 0) {
				vcArray.push({
					"id" : graph.nodes[i].virtual_chassis,
					"nodes_amount": 1
				});
			}
			else
				vcArray[parentVC].nodes_amount++;
		}
		
		// fill groupsArray
		if (!groupsArray[graph.nodes[i].group])
			groupsArray[graph.nodes[i].group] = 1;
		else
			groupsArray[graph.nodes[i].group]++;
		
		// calculate number of nodes in the largest group
		if (groupsArray[graph.nodes[i].group] > nodesInLargestGroup)
			nodesInLargestGroup = groupsArray[graph.nodes[i].group];
		
		// calculate position of node in the group (will be used to determine node's Y coordinate)
		graph.nodes[i].positionInGroup = groupsArray[graph.nodes[i].group];
	}



	// For sibling links (several links between two nodes) add lineScale attribute
	// lineScale attribute is used to display sibling links without overlapping
	for (i in graph.links) {
		var siblings = getSiblingLinks(graph.links[i].source, graph.links[i].target);
		if (siblings.length > 1) {
			var lineScale = d3.scalePoint()
				.domain(siblings)
				.range([1, siblings.length])(graph.links[i].bandwidth);
			graph.links[i].lineScale = lineScale;
		}
	}

	// Calculate the height and width of SVG
	svgComfortableHeight = nodesInLargestGroup * COLLISION_RADIUS * 2 + 100; // + 40;
	if ((window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) > svgComfortableHeight)
		svgHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
	else
		svgHeight = svgComfortableHeight;
	
	// Put nodes in fixed Y positions (sorted by node.id)
	for (i in graph.nodes) {
		groupOffsetY = (nodesInLargestGroup - groupsArray[graph.nodes[i].group])/2 * COLLISION_RADIUS * 2;
		graph.nodes[i].fy = COLLISION_RADIUS * 2 * graph.nodes[i].positionInGroup + groupOffsetY;
		//graph.nodes[i].fx=1;
		graph.nodes[i].fx =  graph.nodes[i].group * svgWidth / groupsArray.length - 60;
	}
	
	var svg = d3.select("svg[id='svg1']");
	svg
		.selectAll("g").remove(); // clear previous chart if any
	svg
		.attr("height", svgHeight)
		.attr("width", svgWidth);  

	globalSimulation = d3.forceSimulation()
		.force("link1", d3.forceLink().id(function(d) { return d.id; })
			/*.distance(function(d){
				if (d.source.cluster === d.target.cluster)
                    if (d.source.group === d.target.group)
                        return 20;
                    else
                        return 180;
				else 
					return null;
			})*/
			.strength(function(d){
				if (d.source.cluster === d.target.cluster || d.source.virtual_chassis === d.target.virtual_chassis)
                    if (d.source.group === d.target.group)
                        return 1;
                    else
                        return 0.003;
				else 
					return 0.001;
			})
		)
		.force("charge", d3.forceManyBody()
			.strength(function(d){
				if ("class" in d && d.class == "circuits" && "type" in d && d.type == "circuit")
					return -10;
				else
					return -300;
			})
		)
		.force("x", d3.forceX(function(d){ return d.group * svgWidth / groupsArray.length - 60; })
			.strength(4)
		)
		.force("y", d3.forceY(function(d){ return svgHeight/2; })
			.strength(function (d){
				// values from 0.5 to 0.01?
				if (nodesInLargestGroup)
					//return (0.9 / nodesInLargestGroup); // TODO: do it the function of number of objects and LINKS in group. Otherwise for small groups it is too strong. For large groups with many links it is also too strong (1.5 strong, 0.9 ok)
					return (0.9 / nodesInLargestGroup);
				else 
					//return 0.1;
					return 0.5;
			})
		)
		//.force("center", d3.forceCenter(svgWidth / 2 + 50, height / 2))
		.force("collision", d3.forceCollide()
			.radius(function(d) {
				if ("class" in d && d.class == "circuits" && "type" in d && d.type == "circuit")
					return COLLISION_RADIUS/2;
				else 
					return COLLISION_RADIUS;
			})
		);

		
	var link1 = svg.append("g")
		.attr("id", "links") 
		.selectAll("path")
		.data(graph.links)
		.enter()
		.append("path")
			.attr("class", function(d) { return "link" + parseInt(d.bandwidth) + "gb"; })
			.attr("stroke-width", function(d) { if ("type" in d) return 0; else if (d.bandwidth == 0) return 1; else return Math.sqrt(parseInt(d.bandwidth))/2; });

	var labelCircle = svg.append("g")
		.attr("id", "labelCircles") 
		.selectAll("circle")
		.data(graph.links)
		.enter().append("circle")
			.attr("class", function(d) { return "link" + parseInt(d.bandwidth) + "gb-label-circle"; })
			.attr("r", function(d) { 
				if (d.quantity > 1) 
					return "7" 
				else 
					return "0"; 
			});
		  
	var label = svg.append("g")
		.attr("id", "labels") 
		.attr("class", "labels") 
		.selectAll("text")
		.data(graph.links)
		.enter().append("text")
			.attr("dy", 3)
			.text(function(d) { if (d.quantity > 1) return d.quantity; else  return ""; });
              
	var node = svg.append("g")
		.attr("id", "nodes")
		.selectAll("a")
		.data(graph.nodes)
		.enter().append("a")
			//.attr("transform", function(d) { return "translate(" +  d.group*(svgWidth*1)/groupsArray.length + "," + d.positionInGroup*COLLISION_RADIUS + ")"; })
			.attr("target", '_blank')
			.attr("xlink:href",  function(d) { return (window.location.href + '?device=' + d.id) });
	node.on("click", function(d,i) {  
		d3.event.preventDefault(); 
		d3.event.stopPropagation(); 
		OnClickDetails(d, graph.interfaces[d.id]);
    });
	node.call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));  
	node.append("image")
		.attr("xlink:href", function(d) { 
			return getImgUrlForDevice(d.type, d.id);
		})
		.attr("width", 32)
		.attr("height", 32)
		.attr("x", -16)
		.attr("y", -16);
	node.append("text")
		.attr("dx", 16)
		.attr("dy", function(d) {if (d.class == "circuits" && d.type == "circuit") return 8; else return 4;} )
		.attr("x", +8)
		.attr("font-weight", function(d) { if ("thisIsCollapsedVC" in d) return "bold"; else return "normal"; })
		.text(function(d) { 
			if (d.class == "devices" && "cluster" in d && d.cluster) 
				return d.id.substring(d.cluster.length+1); 
			else if ("virtual_chassis" in d && d.virtual_chassis)
				return getShortNameOfVcNode(d.virtual_chassis, d.id);
			else
				return d.id; 
		});                
	node.append("text")
		.attr("fill", "grey")
		.attr("font-size", "0.8em")
		.attr("dx", 16)
		.attr("dy", -6)
		.attr("x", +8)
		.attr("font-weight", "normal")
		.text(function(d) { 
			if (d.class == "circuits" && d.type == "circuit") 
				return d.circuit_type;
			else
				return ""; 
		});                
	node.append("title")
		.text(function(d) { return d.id; });
	
	var collapsedVC = d3.selectAll("g[id='nodes']").selectAll("a").filter(function(d) { if (d.thisIsCollapsedVC) return true; else return false;});
	/* collapsedVC.append("image")
		.attr("xlink:href", "/img/vc.svg")
		.attr("width", 16)
		.attr("height", 16)
		.attr("x", 8)
		.attr("y", -24);*/
	collapsedVC.append("ellipse")
		.attr("cx", 16)
		.attr("cy", -16)
		.attr("rx", 8)
		.attr("ry", 8)
		.attr("class", "vcNodesNumCircle");
	collapsedVC.append("text")
		.attr("x", function(d) {return getTextPositionInLabel(d.nodes.length);} )
		.attr("y", -12)
		.attr("class", "vcNodesNum")
			.text(function(d) { return d.nodes.length; });
		
	var cluster = svg.append("g")
		.attr("id", "clusters") 
		.attr("class", "clusters") 
		.selectAll("g")
		.data(clustersArray)
		.enter().append("g");
			//.attr("transform", "translate(0,0)");
	/*cluster.append("rect")
		.attr("height", "12")
		.attr("width", "12")
		.attr("rx", "6")
		.attr("ry", "6");*/
	cluster.append("path")
		.attr("d", "")
		.style("fill", "none");
	cluster.append("text")
		.attr("x", "2") 
		.attr("y", "-4") 
		//.attr("font-size", "0.8em") 
		.attr("transform", "translate(0,0)")
		.attr("font-weight", "bold")
			.text(function(d) { return d.id });  
	  
	var vc = svg.append("g")
		.attr("id", "VCs") 
		.attr("class", "VCs") 
		.selectAll("g")
		.data(vcArray)
		.enter().append("g");
			//.attr("transform", "translate(0,0)");
	vc.append("path")
		.attr("d", "")
		.style("fill", "none");
	vc.append("text")
		.attr("x", "2") 
		.attr("y", "-4") 
		//.attr("font-size", "0.8em") 
		.attr("transform", "translate(0,0)")
		.attr("font-weight", "bold")
			.text(function(d) { return d.id; });  
		
	globalSimulation
		.nodes(graph.nodes)
		.on("tick", ticked);
	
	globalSimulation.force("link1")
		.links(graph.links);
	  
	
	// returns the short name of a device that is a member of VC by discarding common portion of the name
	// example: VC 'dc1-sw02', device 'dc1-sw02-node3' -> short name 'node3' 
	function getShortNameOfVcNode(vcName, fullNodeName) {
		let shortName = "";
		fullNodeName.split('').forEach(function(val, i) {
			if (val != vcName.charAt(i))
				shortName += val ;         
		});
		if (shortName.charAt(0) == "-" || shortName.charAt(0) == "_")
			shortName = shortName.substring(1);
		return shortName;
	}

	// returns the array of bandwidthes of all sibling links sorted from larger to smaller
	function getSiblingLinks(source, target) {
		var siblings = [];
		for(var i = 0; i < graph.links.length; ++i){
			if( (graph.links[i].source == source && graph.links[i].target == target) || 
				(graph.links[i].source == target && graph.links[i].target == source) )
				siblings.push(graph.links[i].bandwidth);
		};
		var sortedSiblings = siblings.sort( function(a, b) {return b-a} );
		return sortedSiblings;
	};

	function circleIntersection(x0, y0, r0, x1, y1, r1) {
        var a, dx, dy, d, h, rx, ry;
        var x2, y2;

        // dx and dy are the vertical and horizontal distances between the circle centers
        dx = x1 - x0;
        dy = y1 - y0;

        // Determine the straight-line distance between the centers
        d = Math.sqrt((dy*dy) + (dx*dx));

        // Check for solvability
        if (d > (r0 + r1)) {
            // no solution. circles do not intersect
            return false;
        }
        if (d < Math.abs(r0 - r1)) {
            // no solution. one circle is contained in the other
            return false;
        }

        // 'point 2' is the point where the line through the circle intersection points crosses the line between the circle centers  

        // Determine the distance from point 0 to point 2
        a = ((r0*r0) - (r1*r1) + (d*d)) / (2.0 * d) ;

        // Determine the coordinates of point 2
        x2 = x0 + (dx * a/d);
        y2 = y0 + (dy * a/d);

        // Determine the distance from point 2 to either of the intersection points
        h = Math.sqrt((r0*r0) - (a*a));

        // Now determine the offsets of the intersection points from point 2
        rx = -dy * (h/d);
        ry = dx * (h/d);

        // Determine the absolute intersection points
        var xi = x2 + rx;
        var yi = y2 + ry;
        var xi_prime = x2 - rx;
        var yi_prime = y2 - ry;

        if (yi > yi_prime) 
        	return [xi, yi];
        else
        	return [xi_prime, yi_prime];

    }

    function getArcR(x1, y1, x2, y2, scale) {
		var dx = x2 - x1,
			dy = y2 - y1,
			dr = Math.sqrt(dx*dx + dy*dy),
			drx = 0.012 * dr * dr / (0.8 * scale);

			return drx;
    }

    function getArcCentre(x1, y1, x2, y2, scale) {
		midX = x1 + (x2-x1)/2,
		midY = y1 + (y2-y1)/2,
		r = getArcR(x1, y1, x2, y2, scale),
		circleСntCoord = circleIntersection(x1, y1, r, x2, y2, r),
		cirCntX = circleСntCoord[0],
		cirCntY = circleСntCoord[1],
		k = (midY - cirCntY)/(midX - cirCntX),
		alf = Math.atan(k);

		if (y2 < y1) {
			x = cirCntX - r * Math.cos(alf);
			y = cirCntY - r * Math.sin(alf);
		}
		else {
			x = cirCntX + r * Math.cos(alf);
			y = cirCntY + r * Math.sin(alf);
		}

		return [x, y];
    }

	function ticked(e) {
		
		/*opacity = 1 - globalSimulation.alpha();
		if (globalSimulation.alpha() > 0.1)
			opacity = 0;
		else 
			opacity = 1;
		svg.attr("opacity", opacity);*/
		
		if (globalSimulation.alpha() < 0.001) {
			generateSVGdownloadLink();
			enableSvgDownloadLink();
		}
		else
			disableSvgDownloadLink();
		
		link1
			.attr("d", function(d) { 
				if (d.lineScale && d.lineScale > 1) {
					var drx = getArcR(d.source.x, d.source.y, d.target.x, d.target.y, d.lineScale),
						dry = drx,
                        sweep = 1,
                        xRotation = 0,
                        largeArc = 0;
                    return "M" + d.source.x + "," + d.source.y + "A" + drx + ", " + dry + " " + xRotation + ", " + largeArc + ", " + sweep + " " + d.target.x + "," + d.target.y;
				}
				else 
					return "M" + d.source.x + " " + d.source.y + " L" + d.target.x + " " + d.target.y; 
			});

		labelCircle
			.attr("cx", function(d) {
				if (d.lineScale && d.lineScale > 1) 
					return getArcCentre(d.source.x, d.source.y, d.target.x, d.target.y, d.lineScale)[0];
				else
					return (d.source.x + d.target.x)/2; 
			})
			.attr("cy", function(d) {
				if (d.lineScale && d.lineScale > 1) {
					return getArcCentre(d.source.x, d.source.y, d.target.x, d.target.y, d.lineScale)[1];
				}
				else
					return (d.source.y + d.target.y)/2; 
			});

		label
			.attr("x", function(d) {
				if (d.lineScale && d.lineScale > 1) 
					return getArcCentre(d.source.x, d.source.y, d.target.x, d.target.y, d.lineScale)[0] + getTextPositionInLabel(d.quantity) - 16;
				else
					return (d.source.x + d.target.x)/2 + getTextPositionInLabel(d.quantity) - 16; 
			})
			.attr("y", function(d) {
				if (d.lineScale && d.lineScale > 1) 
					return getArcCentre(d.source.x, d.source.y, d.target.x, d.target.y, d.lineScale)[1];
				else
					return (d.source.y + d.target.y)/2; 
			});

		node
			.attr("transform", function(d) { 
				if (globalSimulation.alpha() < 0.9)
					if (d.fx || d.fy) {
						d.fx = null;
						d.fy = null;
					}
				return "translate(" + d.x + "," + d.y + ")";
			});        

		cluster.select("text")
			.attr("transform", function(d) {
				var minX = 100000;
				var maxX = 0;
				var minY = 100000;
				var maxY = 0;
				var leftGroup = 100000;
				var rightGroup = 0;
				
				var leftY1 = 100000;
				var leftY2 = 0;
				var rightY1 = 100000;
				var rightY2 = 0;
				
				for (var i = 0; i < graph.nodes.length; i++) {
					if ("cluster" in graph.nodes[i] && 
						graph.nodes[i].cluster === d.id && 
						graph.nodes[i].hasOwnProperty("x") && 
						graph.nodes[i].x > 0 )
					{
						if (graph.nodes[i].x < minX) 
							minX = graph.nodes[i].x;
						if (graph.nodes[i].x > maxX) 
							maxX = graph.nodes[i].x;

						if (graph.nodes[i].group < leftGroup) 
							leftGroup = graph.nodes[i].group;
						if (graph.nodes[i].group > rightGroup) 
							rightGroup = graph.nodes[i].group;
							
						if (graph.nodes[i].y < minY) 
							minY = graph.nodes[i].y;
						if (graph.nodes[i].y > maxY) 
							maxY = graph.nodes[i].y;
							
						if (graph.nodes[i].group === leftGroup) 
							if (graph.nodes[i].y < leftY1)
								leftY1 = graph.nodes[i].y;
							else if (graph.nodes[i].y > leftY2)
								leftY2 = graph.nodes[i].y;
							else
								{}
						
						if (graph.nodes[i].group === rightGroup) 
							if (graph.nodes[i].y < rightY1)
								rightY1 = graph.nodes[i].y;
							else if (graph.nodes[i].y > rightY2)
								rightY2 = graph.nodes[i].y;
							else
								{}
					}
				}
				d.minX = minX;
				d.maxX = maxX;
				d.minY = minY;
				d.maxY = maxY;
				return "translate(" + (minX - 21) + "," + (leftY1 - 21) + ")";
			});

		cluster		
			.select("path")
				.attr("d", function(d) {
					var minX = 100000;
					var maxX = 0;
					var minY = 100000;
					var maxY = 0;
					var leftGroup = 100000;
					var rightGroup = 0;
					
					var leftY1 = 100000;
					var leftY2 = 0;
					var rightY1 = 100000;
					var rightY2 = 0;

					for (var i = 0; i < graph.nodes.length; i++) {
						if ("cluster" in graph.nodes[i] && 
							graph.nodes[i].cluster === d.id && 
							graph.nodes[i].hasOwnProperty("x") && 
							graph.nodes[i].x > 0 )
						{
							if (graph.nodes[i].group < leftGroup) 
								leftGroup = graph.nodes[i].group;
								
							if (graph.nodes[i].x < minX)
								minX = graph.nodes[i].x;
							
							if (graph.nodes[i].group > rightGroup)
								rightGroup = graph.nodes[i].group;
								
							if (graph.nodes[i].x > maxX)
								maxX = graph.nodes[i].x;						}
					}

					for (var i = 0; i < graph.nodes.length; i++) {
						if ("cluster" in graph.nodes[i] && 
							graph.nodes[i].cluster === d.id && 
							graph.nodes[i].hasOwnProperty("x") && 
							graph.nodes[i].x > 0 )
						{
							if (graph.nodes[i].group === leftGroup) {
								if (graph.nodes[i].y < leftY1)
									leftY1 = graph.nodes[i].y;
								if (graph.nodes[i].y > leftY2)
									leftY2 = graph.nodes[i].y;		
							}
							
							if (graph.nodes[i].group === rightGroup)  {
								if (graph.nodes[i].y < rightY1) {
									rightY1 = graph.nodes[i].y;
								}
								if (graph.nodes[i].y > rightY2)
									rightY2 = graph.nodes[i].y;
							}
						}
					}
			
					minX -= 20;
					maxX += 20;
					leftY1 -= 20;
					leftY2 += 20;
					rightY1 -= 20;
					rightY2 += 20;
					
					path = "M " + minX + "," + leftY1 + " ";
					if (leftY1 < rightY1)
						path += "L " + (minX + 40) + ", " + leftY1 + " ";
					else
						path += "L " + (maxX - 40) + ", " + rightY1 + " ";
					path += "L " + maxX + "," + rightY1 + " " +
						   "L " + maxX + "," + rightY2 + " ";
					if (leftY2 > rightY2)
						path += "L " + (minX + 40) + ", " + leftY2 + " ";
					else
						path += "L " + (maxX - 40) + ", " + rightY2 + " ";
					
					path += "L " + minX + "," + leftY2 + " " +
						   "Z";
					
					return path;
				});


		vc.select("text")
			.attr("transform", function(d) {
				var minX = 100000;
				var maxX = 0;
				var minY = 100000;
				var maxY = 0;
				var leftGroup = 100000;
				var rightGroup = 0;
				
				var leftY1 = 100000;
				var leftY2 = 0;
				var rightY1 = 100000;
				var rightY2 = 0;
				
				for (var i = 0; i < graph.nodes.length; i++) {
					if 	("virtual_chassis" in graph.nodes[i] && 
							graph.nodes[i].virtual_chassis === d.id /*&& 
							graph.nodes[i].hasOwnProperty("x") && 
							graph.nodes[i].x > 0 */
						)
					{
						if (graph.nodes[i].x < minX) 
							minX = graph.nodes[i].x;
						if (graph.nodes[i].x > maxX) 
							maxX = graph.nodes[i].x;

						if (graph.nodes[i].group < leftGroup) {
							leftGroup = graph.nodes[i].group;
							leftY1 = 100000;
							leftY2 = 0;
						}
						if (graph.nodes[i].group > rightGroup) { 
							rightGroup = graph.nodes[i].group;
							rightY1 = 100000;
							rightY2 = 0;
						}

						if (graph.nodes[i].y < minY) 
							minY = graph.nodes[i].y;
						if (graph.nodes[i].y > maxY) 
							maxY = graph.nodes[i].y;
							
						if (graph.nodes[i].group === leftGroup) {
							if (graph.nodes[i].y < leftY1)
								leftY1 = graph.nodes[i].y;
							else if (graph.nodes[i].y > leftY2)
								leftY2 = graph.nodes[i].y;
							else
								{}
						}
						
						if (graph.nodes[i].group === rightGroup) 
							if (graph.nodes[i].y < rightY1)
								rightY1 = graph.nodes[i].y;
							else if (graph.nodes[i].y > rightY2)
								rightY2 = graph.nodes[i].y;
							else
								{}
					}
				}
				
				d.minX = minX;
				d.maxX = maxX;
				d.minY = minY;
				d.maxY = maxY;
				
				return "translate(" + (minX - 21) + "," + (leftY1 - 21) + ")";
			});

		vc		
			.select("path")
				.attr("d", function(d) {
					var minX = 100000;
					var maxX = 0;
					var minY = 100000;
					var maxY = 0;
					var leftGroup = 100000;
					var rightGroup = 0;
					
					var leftY1 = 100000;
					var leftY2 = 0;
					var rightY1 = 100000;
					var rightY2 = 0;
					
					for (var i = 0; i < graph.nodes.length; i++) {
						if ("virtual_chassis" in graph.nodes[i] && 
							graph.nodes[i].virtual_chassis === d.id && 
							graph.nodes[i].hasOwnProperty("x") && 
							graph.nodes[i].x > 0 )
						{
							if (graph.nodes[i].group < leftGroup) 
								leftGroup = graph.nodes[i].group;
								
							if (graph.nodes[i].x < minX)
								minX = graph.nodes[i].x;
							
							if (graph.nodes[i].group > rightGroup)
								rightGroup = graph.nodes[i].group;
								
							if (graph.nodes[i].x > maxX)
								maxX = graph.nodes[i].x;						}
					}

					for (var i = 0; i < graph.nodes.length; i++) {
						if ("virtual_chassis" in graph.nodes[i] && 
							graph.nodes[i].virtual_chassis === d.id && 
							graph.nodes[i].hasOwnProperty("x") && 
							graph.nodes[i].x > 0 )
						{
							if (graph.nodes[i].group === leftGroup) {
								if (graph.nodes[i].y < leftY1)
									leftY1 = graph.nodes[i].y;
								if (graph.nodes[i].y > leftY2)
									leftY2 = graph.nodes[i].y;		
							}
							
							if (graph.nodes[i].group === rightGroup)  {
								if (graph.nodes[i].y < rightY1) {
									rightY1 = graph.nodes[i].y;
								}
								if (graph.nodes[i].y > rightY2)
									rightY2 = graph.nodes[i].y;
							}
						}
					}
			
					minX -= 20;
					maxX += 20;
					leftY1 -= 20;
					leftY2 += 20;
					rightY1 -= 20;
					rightY2 += 20;
					
					path = "M " + minX + "," + leftY1 + " ";
					if (leftY1 < rightY1)
						path += "L " + (minX + 40) + ", " + leftY1 + " ";
					else
						path += "L " + (maxX - 40) + ", " + rightY1 + " ";
					path += "L " + maxX + "," + rightY1 + " " +
						   "L " + maxX + "," + rightY2 + " ";
					if (leftY2 > rightY2)
						path += "L " + (minX + 40) + ", " + leftY2 + " ";
					else
						path += "L " + (maxX - 40) + ", " + rightY2 + " ";
					
					path += "L " + minX + "," + leftY2 + " " +
						   "Z";
					
					return path;
				});

	}
	
	function dragstarted(d) {
		if (!d3.event.active) 
			globalSimulation.alphaTarget(0.3).restart();
		d.fx = d.x;
		d.fy = d.y;
	}

	function dragged(d) {
		d.fx = d3.event.x;
		d.fy = d3.event.y;
	}

	function dragended(d) {
		if (!d3.event.active) 
			globalSimulation.alphaTarget(0);
		d.fx = null;
		d.fy = null;
	}

	document.getElementById('progressbar').style.display = 'none';
// commented JSON read from file
// });

	function getTextPositionInLabel(text) {
		text = text + "";
		return 15 - (text.length * 2.2); 
	}

	function compareVcNodes(a, b) {
		if (a.position_in_vc < b.position_in_vc)
			return -1;
		else if (a.position_in_vc > b.position_in_vc)
			return 1;
		else
			return 0;
	}

	function compareNodes(a, b) {
		function getStrPortion(s) {
			return s.match(/^\D+/);
		}

		function getNumberPortion(s) {
			return s.match(/^\d+/);
		}

		function compareSubstr(a, b) {
			if (a > b) 
				return 1;
			else if (a < b)
				return -1;
			else
				return 0;
		}

		function compareNumbers(a, b){
			intA = Number(a);
			intB = Number(b);
			if (intA > intB) 
				return 1;
			else if (intA < intB)
				return -1;
			else
				return 0;
		}

		if (a.group < b.group) // put nodes of left group on top of right group nodes, so labels of left nodes will not be overlapped by rught nodes
			return 1;
		else if (a.group > b.group)
			return -1;
		else { // if nodes are in the same group, sort them alphabetically
			aStr = a.id;
			bStr = b.id;

			while (aStr && bStr) {
				// find letter and digit portions of strings and compare them differently. This is fo ensure that str "011" is "bigger" than "10" 
				aSub = getStrPortion(aStr);
				bSub = getStrPortion(bStr);
				aSubIsNumber = false;
				bSubIsNumber = false;

				if (!aSub) {
					aSub = getNumberPortion(aStr);
					aSubIsNumber = true;
				}
				if (!bSub) {
					bSub = getNumberPortion(bStr);
					bSubIsNumber = true;
				}

				if (!aSub)
					if (!bSub)
						return 0;
					else
						return -1;

				if (aSubIsNumber && bSubIsNumber)
					compResult = compareNumbers(aSub, bSub);
				else
					compResult = compareSubstr(aSub, bSub);

				if (compResult != 0)
					return compResult;

				aStr = aStr.substring(aSub[0].length);
				bStr = bStr.substring(bSub[0].length);
			}

			return 0;
		}
	}

}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function getPageNameFromId() {
	d3.json(NTMAP_BACKEND_URI + "/l1maps", function(error, mapsListResults) {
		if (error) 
			throw error;
		if (mapsListResults.result != "success") {
			document.getElementById("crumbs_last_element").innerHTML = mapsListResults.result;
			return null;
		}

		mapsList = mapsListResults["results"];
		
		pageName = "";
		for (i in mapsList)  {
			for (j in mapsList[i]["maps"]) {
				if (parseInt(mapsList[i]["maps"][j]["id"]) == parseInt(getParameterByName("id"))) {
					pageName = mapsList[i]["maps"][j]["name"];
				}
			}
			
		}
		
		document.getElementById("crumbs_last_element").innerHTML = pageName;
	});
	
	return null;
}

//////////////////////////////////////////////////////////////////////////////////////

getPageNameFromId();
getDOMofSVGimages();
getL1Map();
