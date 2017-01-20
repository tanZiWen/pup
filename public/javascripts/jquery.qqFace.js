// QQ表情插件
var em = [
    {'id':1,'phrase':'[微笑]','url':'1.gif'},{'id':2,'phrase':'[撇嘴]','url':'2.gif'},
    {'id':3,'phrase':'[色]','url':'3.gif'},{'id':4,'phrase':'[发呆]','url':'4.gif'},
    {'id':5,'phrase':'[流泪]','url':'5.gif'},{'id':6,'phrase':'[害羞]','url':'6.gif'},
    {'id':7,'phrase':'[闭嘴]','url':'7.gif'},{'id':8,'phrase':'[睡]','url':'8.gif'},
    {'id':9,'phrase':'[大哭]','url':'9.gif'},{'id':10,'phrase':'[尴尬]','url':'10.gif'},
    {'id':11,'phrase':'[发怒]','url':'11.gif'},{'id':12,'phrase':'[调皮]','url':'12.gif'},
    {'id':13,'phrase':'[呲牙]','url':'13.gif'},{'id':14,'phrase':'[惊讶]','url':'14.gif'},
    {'id':15,'phrase':'[难过]','url':'15.gif'},{'id':16,'phrase':'[冷汗]','url':'16.gif'},
    {'id':17,'phrase':'[抓狂]','url':'17.gif'},{'id':18,'phrase':'[吐]','url':'18.gif'},
    {'id':19,'phrase':'[偷笑]','url':'19.gif'},{'id':20,'phrase':'[愉快]','url':'20.gif'},
    {'id':21,'phrase':'[白眼]','url':'21.gif'},{'id':22,'phrase':'[傲慢]','url':'22.gif'},
    {'id':23,'phrase':'[饥饿]','url':'23.gif'},{'id':24,'phrase':'[困]','url':'24.gif'},
    {'id':25,'phrase':'[惊恐]','url':'25.gif'},{'id':26,'phrase':'[流汗]','url':'26.gif'},
    {'id':27,'phrase':'[憨笑]','url':'27.gif'},{'id':28,'phrase':'[悠闲]','url':'28.gif'},
    {'id':29,'phrase':'[奋斗]','url':'29.gif'},{'id':30,'phrase':'[咒骂]','url':'30.gif'},
    {'id':31,'phrase':'[疑问]','url':'31.gif'},{'id':32,'phrase':'[嘘]','url':'32.gif'},
    {'id':33,'phrase':'[晕]','url':'33.gif'},{'id':34,'phrase':'[疯了]','url':'34.gif'},
    {'id':35,'phrase':'[衰]','url':'35.gif'},{'id':36,'phrase':'[敲打]','url':'36.gif'},
    {'id':37,'phrase':'[再见]','url':'37.gif'},{'id':38,'phrase':'[擦汗]','url':'38.gif'},
    {'id':39,'phrase':'[抠鼻]','url':'39.gif'},{'id':40,'phrase':'[糗大了]','url':'40.gif'},
    {'id':41,'phrase':'[坏笑]','url':'41.gif'},{'id':42,'phrase':'[左哼哼]','url':'42.gif'},
    {'id':43,'phrase':'[右哼哼]','url':'43.gif'},{'id':44,'phrase':'[哈欠]','url':'44.gif'},
    {'id':45,'phrase':'[鄙视]','url':'45.gif'},{'id':46,'phrase':'[委屈]','url':'46.gif'},
    {'id':47,'phrase':'[快哭了]','url':'47.gif'},{'id':48,'phrase':'[阴险]','url':'48.gif'},
    {'id':49,'phrase':'[亲亲]','url':'49.gif'},{'id':50,'phrase':'[吓]','url':'50.gif'},
    {'id':51,'phrase':'[可怜]','url':'51.gif'},{'id':52,'phrase':'[拥抱]','url':'52.gif'},
    {'id':53,'phrase':'[月亮]','url':'53.gif'},{'id':54,'phrase':'[太阳]','url':'54.gif'},
    {'id':55,'phrase':'[炸弹]','url':'55.gif'},{'id':56,'phrase':'[骷髅]','url':'56.gif'},
    {'id':57,'phrase':'[菜刀]','url':'57.gif'},{'id':58,'phrase':'[猪头]','url':'58.gif'},
    {'id':59,'phrase':'[西瓜]','url':'59.gif'},{'id':60,'phrase':'[咖啡]','url':'60.gif'},
    {'id':61,'phrase':'[饭]','url':'61.gif'},{'id':62,'phrase':'[爱心]','url':'62.gif'},
    {'id':63,'phrase':'[强]','url':'63.gif'},{'id':64,'phrase':'[弱]','url':'64.gif'},
    {'id':65,'phrase':'[握手]','url':'65.gif'},{'id':66,'phrase':'[胜利]','url':'66.gif'},
    {'id':67,'phrase':'[抱拳]','url':'67.gif'},{'id':68,'phrase':'[勾引]','url':'68.gif'},
    {'id':69,'phrase':'[OK]','url':'69.gif'},{'id':70,'phrase':'[NO]','url':'70.gif'},
    {'id':71,'phrase':'[玫瑰]','url':'71.gif'},{'id':72,'phrase':'[凋谢]','url':'72.gif'},
    {'id':73,'phrase':'[嘴唇]','url':'73.gif'},{'id':74,'phrase':'[爱情]','url':'74.gif'},
    {'id':75,'phrase':'[飞吻]','url':'75.gif'}
];
var emMap = {};
for(var i=1; i<=em.length; i++){
    var faceObj = em[i-1];
    emMap[faceObj.phrase] = faceObj.url;
}
(function($){
	$.fn.qqFace = function(options){
		var defaults = {
			id : 'facebox',
			path : '/stylesheets/face/',
			assign : 'sendMsgTa',
			tip : 'em_'
		};
		var option = $.extend(defaults, options);
		var assign = $('#'+option.assign);
		var id = option.id;
		var path = option.path;
		var tip = option.tip;
		
		if(assign.length<=0){
			alert('缺少表情赋值对象。');
			return false;
		}
		
		$(this).click(function(e){
			var strFace, labFace;
			if($('#'+id).length<=0){
				strFace = '<div id="'+id+'" style="position:absolute;display:none;z-index:1000;" class="qqFace">' +
							  '<table border="0" cellspacing="0" cellpadding="0"><tr>';
				for(var i=1; i<=em.length; i++){
                    var faceObj = em[i-1];
					labFace = faceObj.phrase;
					strFace += '<td><img src="'+path+faceObj.url+'" onclick="$(\'#'+option.assign+'\').setCaret();$(\'#'+option.assign+'\').insertAtCaret(\'' + labFace + '\');" /></td>';
					if( i % 15 == 0 ) strFace += '</tr><tr>';
				}
				strFace += '</tr></table></div>';
			}
			$(this).parent().append(strFace);
			var offset = $(this).position();
			var top = offset.top + $(this).outerHeight();
			$('#'+id).css('top',top);
			$('#'+id).css('left',offset.left);
			$('#'+id).show();
			e.stopPropagation();
		});

		$(document).click(function(){
			$('#'+id).hide();
			$('#'+id).remove();
		});
	};

})(jQuery);

jQuery.extend({ 
unselectContents: function(){ 
	if(window.getSelection) 
		window.getSelection().removeAllRanges(); 
	else if(document.selection) 
		document.selection.empty(); 
	} 
}); 
jQuery.fn.extend({ 
	selectContents: function(){ 
		$(this).each(function(i){ 
			var node = this; 
			var selection, range, doc, win; 
			if ((doc = node.ownerDocument) && (win = doc.defaultView) && typeof win.getSelection != 'undefined' && typeof doc.createRange != 'undefined' && (selection = window.getSelection()) && typeof selection.removeAllRanges != 'undefined'){ 
				range = doc.createRange(); 
				range.selectNode(node); 
				if(i == 0){ 
					selection.removeAllRanges(); 
				} 
				selection.addRange(range); 
			} else if (document.body && typeof document.body.createTextRange != 'undefined' && (range = document.body.createTextRange())){ 
				range.moveToElementText(node); 
				range.select(); 
			} 
		}); 
	}, 

	setCaret: function(){ 
		var initSetCaret = function(){
			var textObj = $(this).get(0); 
			textObj.caretPos = document.selection.createRange().duplicate(); 
		}; 
		$(this).click(initSetCaret).select(initSetCaret).keyup(initSetCaret);
        $(this).focus();
    },

	insertAtCaret: function(textFeildValue){ 
		var textObj = $(this).get(0); 
		if(document.all && textObj.createTextRange && textObj.caretPos){ 
			var caretPos=textObj.caretPos; 
			caretPos.text = caretPos.text.charAt(caretPos.text.length-1) == '' ? 
			textFeildValue+'' : textFeildValue; 
		} else if(textObj.setSelectionRange){ 
			var rangeStart=textObj.selectionStart; 
			var rangeEnd=textObj.selectionEnd; 
			var tempStr1=textObj.value.substring(0,rangeStart); 
			var tempStr2=textObj.value.substring(rangeEnd); 
			textObj.value=tempStr1+textFeildValue+tempStr2;
			textObj.focus(); 
			var len=textFeildValue.length; 
			textObj.setSelectionRange(rangeStart+len,rangeStart+len); 
			textObj.blur(); 
		}else{ 
			textObj.value+=textFeildValue; 
		}
        $(this).focus();
	}
});