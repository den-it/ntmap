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


function OnClickDetails(device, interfaces) {
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
		for (i in device.nodes) {
			text += "<p style='margin-top: 0; margin-bottom: 0.2em;'>" + device.nodes[i].manufacturer + " " + device.nodes[i].model + "<br/>";
			text += "<span class='secondary_text'>" + device.nodes[i].serial + "</span></p>";
		}
	}
	else {
		text += "<p style='margin-top: 0;'>" + device.manufacturer + " "  + device.model + "<br/>";
		text += "<span class='secondary_text'>" + device.serial + "</span></p>";
	}
	
	text += "<p><b style='margin-top: 2em;'>Interfaces:</b></p>";
	text += "<table class='infobox_tab' id='infobox_tab'>";
	text += "<thead><tr> <th width='1%'><div>&nbsp;</div></th> <th width='1%'><div>Local<br/>int</div></th> <th width='1%'><div>Local<br/>LAG</div></th> <th width='1%'><div>Neighbor</div></th> <th width='1%'><div>Neighbor<br/>int</div></th> <th><div>Description</div></th> </tr></thead>";
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
			text += "<td class='secondary_text' nowrap><a target='_blank' href='" + NETBOX_URL + "/dcim/devices/" + interfaces[i].neighbor_netbox_id + "/' class='secondary_text'>" + interfaces[i].neighbor + "</a></td>";
			text += "<td class='secondary_text' nowrap><a target='_blank' href='" + NETBOX_URL + "/dcim/interfaces/" + interfaces[i].neighbor_interface_netbox_id + "/' class='secondary_text'>" + interfaces[i].neighbor_interface + "</a></td>";
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
	
	// ajust height of table (if we have a big list of interfaces) so that it fits infobox dimensions 
	// TODO: do it with pure CSS
	var infoboxTab = document.getElementById('infobox_tab');
	
	infobox.style.height = "calc(100vh - 50px)";
	if ((infoboxTab.offsetTop + infoboxTab.scrollHeight) > (infobox.offsetTop + infobox.clientHeight)) 
		infoboxTab.style.height = (infobox.clientHeight - infoboxTab.offsetTop - 30) + "px";
	else 
		infobox.style.height = (infoboxTab.offsetTop + infoboxTab.clientHeight - infobox.offsetTop + 20) + "px";
}


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
			if (graph.nodes[i].hasOwnProperty("virtual_chassis_id") && graph.nodes[i].virtual_chassis_id) { // This is a VC node. It shouldn't be added to nodes list. Instead a VC node should be generated
				
				// if vcDict doesn't have this VC, add it to vcDict
				if (!vcDict[graph.nodes[i].virtual_chassis_id]) {
					vcDict[graph.nodes[i].virtual_chassis_id] = {"leftGroup": graph.nodes[i].group, "nodes": [] };
					
					// add this node to new nodesList with the name of VC
					firstNodeOfVC = Object.assign({}, graph.nodes[i]);
					firstNodeOfVC.id = graph.nodes[i].virtual_chassis;
					firstNodeOfVC.netbox_id = graph.nodes[i].virtual_chassis_id;
					firstNodeOfVC.serial = "";
					firstNodeOfVC.model = "";
					firstNodeOfVC.manufacturer = "";
					firstNodeOfVC.thisIsCollapsedVC = true;
					delete firstNodeOfVC["virtual_chassis"];
					delete firstNodeOfVC["virtual_chassis_id"];

					nodesList.push(firstNodeOfVC);
				}
				else { // node is in the vcDict
					// select left group of VC. That will display the collapsed-VC-node in the very left group
					if (graph.nodes[i].group < vcDict[graph.nodes[i].virtual_chassis_id]["leftGroup"]) 
						vcDict[graph.nodes[i].virtual_chassis_id].leftGroup = graph.nodes[i].group;
				}

				
				var nodeInfo = { "serial": graph.nodes[i].serial, "manufacturer": graph.nodes[i].manufacturer, "model": graph.nodes[i].model };
				vcDict[graph.nodes[i].virtual_chassis_id].nodes.push(nodeInfo);
				
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
			if (nodesList[i].hasOwnProperty("thisIsCollapsedVC") && vcDict[nodesList[i].netbox_id]) 
				nodesList[i].nodes = vcDict[nodesList[i].netbox_id].nodes;

		// for each link 
		//		find all links of this node leading to virtual_chassis members and delete them
		// find all links with the same A and Z and sum amount of them
		var linksList = new Array();
		
		for (i in graph.links) {
			if (graph.links[i].source != graph.links[i].target) {
				var similarLinks = false;
				for (j in linksList) {
					if (graph.links[i].source === linksList[j].source && graph.links[i].target === linksList[j].target) {
						similarLinks = true;
						linksList[j].quantity = parseInt(linksList[j].quantity) + parseInt(graph.links[i].quantity);
					}
				}
				
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

	// TODO: add provider channels
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
			.strength(-300)
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
				if ("type" in d)
					return COLLISION_RADIUS;
				else 
					return COLLISION_RADIUS;
			})
		);

		
	var link1 = svg.append("g")
		.attr("id", "links") 
		.selectAll("line")
		.data(graph.links)
		.enter()
		.append("line")
			.attr("class", function(d) { return "link" + parseInt(d.bandwidth) + "gb"; })
			.attr("stroke-width", function(d) { if ("type" in d) return 0; else return Math.sqrt(parseInt(d.bandwidth))/2; });

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
		//.attr("font-size", "0.8em") 
		.attr("dx", 16)
		.attr("dy", 4)
		.attr("x", +8)
		.attr("font-weight", function(d) { if ("thisIsCollapsedVC" in d) return "bold"; else return "normal"; })
		.text(function(d) { 
			if ("cluster" in d && d.cluster) 
				return d.id.substring(d.cluster.length+1); 
			else if ("virtual_chassis" in d && d.virtual_chassis)
				return d.id.substring(d.virtual_chassis.length+1); 
			//else if ("thisIsCollapsedVC" in d)
			//	return d.id + " (vc)";
			else
				return d.id; 
		});                
	node.append("title")
		.text(function(d) { return d.id; });
	
	var collapsedVC = d3.selectAll("g[id='nodes']").selectAll("a").filter(function(d) { if (d.thisIsCollapsedVC) return true; else return false;});
	collapsedVC.append("image")
		.attr("xlink:href", "/img/vc.svg")
		.attr("width", 16)
		.attr("height", 16)
		.attr("x", 8)
		.attr("y", -24);
		
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
			.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });

		labelCircle
			.attr("cx", function(d) {
				return (d.source.x + d.target.x)/2 + 3; })
			.attr("cy", function(d) {
				return (d.source.y + d.target.y)/2; });

		label
			.attr("x", function(d) {
				return (d.source.x + d.target.x)/2; })
			.attr("y", function(d) {
				return (d.source.y + d.target.y)/2; });

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


	function compareNodes(a, b) {
		if (a.group < b.group) // put nodes of left group on top of right group nodes, so labels of left nodes will not be overlapped by rught nodes
			return 1;
		else if (a.group > b.group)
			return -1;
		else { // if nodes are in the same group, sort them alphabetically
			// Normalize strings a and b like this: dc2-sw01-member1 => DC2-SW01-MEMBER01. This is easier to compare
			var aToCompare = a.id;
			var bToCompare = b.id;
			//console.log(b);
			
			aToCompare = aToCompare.replace(/(member)([0-9]$)/, (match, name, member_id) => `${name}0${member_id}`);
			bToCompare = bToCompare.replace(/(member)([0-9]$)/, (match, name, member_id) => `${name}0${member_id}`);
			aToCompare = aToCompare.replace(/(node)([0-9]$)/, (match, name, member_id) => `${name}0${member_id}`);
			bToCompare = bToCompare.replace(/(node)([0-9]$)/, (match, name, member_id) => `${name}0${member_id}`);
			aToCompare = aToCompare.toUpperCase();
			bToCompare = bToCompare.toUpperCase();
			
			// compare normalized node names
			if (aToCompare > bToCompare) 
				return 1;
			else if (aToCompare < bToCompare)
				return -1;
			else
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
		
		mapsList = mapsListResults["results"]; // TODO: parse errors in case result is not success
		
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
