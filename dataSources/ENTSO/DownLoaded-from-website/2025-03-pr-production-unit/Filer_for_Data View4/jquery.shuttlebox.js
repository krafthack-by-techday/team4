/*
//===============================================================================
// EXAMPLE OF USE
//===============================================================================

var options =
{
	leftLabel : "",
	rightLabel : "",
	[dataSource : []]
}

1) VARIANT
----------
HTML:
<select id="shuttleBox" multiple="multiple" size="6">
    <option value="a" selected="selected">A</option>
    <option value="b" selected="selected">B</option>
    <option value="c">C</option>
    <option value="d">D</option>
    <option value="e" selected="selected">E</option>
</select>

Dynamic representation in jsp
	<select id="shuttleBox" multiple="multiple" size="6">
		<c:out value="${shuttleBoxOptions}" escapeXml="false"/>
	</select>

JAVASCRIPT:
	$('#shuttleBox').shuttleBox(options); 
	
	
2) VARIANT
----------
HTML:
	<select id="shuttleBox" multiple="multiple" size="6"></select>

JSON FORMAT:
	var data = [{"id":a,"value":"A", "selected": true},
	            {"id":b,"value":"B", "selected": true},
	            {"id":c,"value":"C", "selected": false},
	            {"id":d,"value":"D", "selected": false},
	            {"id":e,"value":"E", "selected": false}];
	options.dataSource = data;                
JAVASCRIPT:
	$('#shuttleBox').shuttleBox(options);                

*/

(function( $ ) {
  $.fn.shuttleBox = function(options) {
	  
	  if (options == undefined || options == null) options = new Object();
	  
      var thisID = "#" + this.attr('id'); // ID of input select component  
      var thisIDWithoutSharp = this.attr('id');
      var sourceListbox = thisID + "Source";
      var destinationListbox = thisID + "Destination";
      var sourceListboxWithoutSharp = this.attr('id') + "Source";
      var destinationListboxWithoutSharp = this.attr('id') + "Destination";
      var add = thisID + "Add";
      var remove = thisID + "Remove";
      var addWithoutSharp = this.attr('id') + "Add";
      var removeWithoutSharp = this.attr('id') + "Remove";
 
      // pro nacitani z json [{"id":1,"value":"value","selected":true},{},...]
      function prepareValuesIntoListboxesFromJson(data) {                  
          $.each(data, function(i, item) {
              if(item.selected == true)
                  $(destinationListbox).append('<option value="'+item.id+'" title="'+item.value+'">'+item.value+'</option>');
              else
                  $(sourceListbox).append('<option value="'+item.id+'" title="'+item.value+'">'+item.value+'</option>');
          });                 
      } 
   
      function prepareValuesIntoListboxesFromListBox() {    
            $(thisID + " option:not(:selected)").clone().appendTo(sourceListbox);
            $(thisID + ' option:selected').clone().appendTo(destinationListbox);
            $(destinationListbox + ' option:selected').removeAttr('selected');
		    $(sourceListbox).find('option').each(function (index, element) {
			    $(element).attr('title', $(element).html())
		    });
		    $(destinationListbox).find('option').each(function (index, element) {
			    $(element).attr('title', $(element).html())
		    });
      }
      
      function sortOptionsByText(listBoxSelector) {

          var selectedOptions = $(listBoxSelector + " option:selected");

          var listItems = $(listBoxSelector + " option");
          listItems.sort(function(a, b){
              var nameA=a.text.toLowerCase(), nameB=b.text.toLowerCase()
              if (nameA < nameB) //sort string ascending
                  return -1
              if (nameA > nameB)
                  return 1
              return 0 //default return value (no sorting)
          });
          $(listItems).remove();
          $(listBoxSelector).append($(listItems));

          selectedOptions.each(function()  { $(listBoxSelector).find("option[value=" + $(this).val() + "]").prop("selected","selected"); });

          return new Promise(function(resolve, reject){//promise due to dependency the function to _forceRedraw
              setTimeout(function(){
                  resolve();
              }, 300);
          });
      }
      
      $(document).on( 'click',add, function () {         
          $(sourceListbox + ' option:selected').remove().appendTo(destinationListbox);
           $(destinationListbox + " option:selected").each(function () {             
               _selectOption(thisID, $(this).val());
               $(this).removeAttr('selected');
           });
           sortOptionsByText(destinationListbox).then(function(intentsArr){
                   _forceRedraw(destinationListbox);
               },
               function(err){
                   console.log(err);
               }
           );

      });  
      $(document).on( 'click',remove, function () {
          $(destinationListbox + ' option:selected').remove().appendTo(sourceListbox);
          $(sourceListbox + " option:selected").each(function () {
              _deSelectOption(thisID, $(this).val());
              $(this).removeAttr('selected');
           });
          sortOptionsByText(sourceListbox).then(function(intentsArr){
                  _forceRedraw(sourceListbox);
              },
              function(err){
                  console.log(err);
              }
          );
      });  
      
      function _selectOption(listBoxSelector, value)
      {
    	  $(listBoxSelector + " option").each(function (){ if ($(this).val() == value) $(this).attr("selected", "selected"); });
      }
      
      function _deSelectOption(listBoxSelector, value)
      {
    	  $(listBoxSelector + " option").each(function (){ if ($(this).val() == value) $(this).removeAttr("selected"); });
      }

      /*
       * Forced redraw
       */
      function _forceRedraw(listboxSelector) {
          $(listboxSelector + " option").each(function () {
              $(this).css('display', '');
              $(this).css('display', 'block');
          });
          $(listboxSelector).css('width', 0);
          $(listboxSelector).css('width', '');  // remove from style tag
      }
      
      $(document).on( 'dblclick',sourceListbox, function () { 
          $(add).trigger('click');
      });
      
      $(document).on( 'dblclick',destinationListbox, function () { 
          $(remove).trigger('click'); 
      });
      
      this.hide(); // hiding original element
      
      var leftLabelHTML = (options.leftLabel) ? "<label>"+ options.leftLabel +"</label>" : "";
      var rightLabelHTML = (options.rightLabel) ? "<label>"+ options.rightLabel +"</label>" : "";
      
	  var list1 = '<div id="'+thisIDWithoutSharp+'DivSource" class="shuttlebox-div-left">'+leftLabelHTML+'<select id="'+ sourceListboxWithoutSharp +'" class="shuttlebox-left" multiple="multiple" size="6"></div>';
      var list2 = '<div id="'+thisIDWithoutSharp+'DivDestination" class="shuttlebox-div-right">'+rightLabelHTML+'<select id="'+ destinationListboxWithoutSharp + '" class="shuttlebox-right" multiple="multiple" size="6"></div>';
	  
      var buttons = this.attr('id') + "Buttons";
	  var controlButtons = '<div id="'+ buttons +'" class="shuttle-buttons">';
	  controlButtons +=      '<div class="shuttle-buttons-middle">';
	  controlButtons +=        '<div class="shuttle-buttons-inner">';
	  controlButtons +=          '<a id="'+ addWithoutSharp +'" class="ui-button-light shuttle-button-right"></a>';
	  controlButtons +=          '<a id="'+ removeWithoutSharp +'" class="ui-button-light shuttle-button-left"></a>';
	  controlButtons +=        '</div>';
	  controlButtons +=      '</div>';
	  controlButtons +=    '</div>';     
      
      var shuttleBoxWrapper = $('<div id="'+this.attr('id')+'shuttleBoxWrapper"></div>');           
      
      shuttleBoxWrapper.insertAfter(this);            
      shuttleBoxWrapper.append(list1);
      shuttleBoxWrapper.append(controlButtons);
      shuttleBoxWrapper.append(list2);                

      $(".shuttle-button-right").button({
          icons : {
              primary : "ui-icon-shuttle-right",
              secondary : null
          },
          text : false
      });

      $(".shuttle-button-left").button({
          icons : {
              primary : "ui-icon-shuttle-left",
                  secondary : null
          },
          text : false
      });

      if(options.dataSource == undefined) prepareValuesIntoListboxesFromListBox();
      else prepareValuesIntoListboxesFromJson(options.dataSource);

      sortOptionsByText(sourceListbox);
      sortOptionsByText(destinationListbox);

  };
})( jQuery );