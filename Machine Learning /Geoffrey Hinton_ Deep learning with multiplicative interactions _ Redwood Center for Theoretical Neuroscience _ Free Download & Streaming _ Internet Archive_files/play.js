
// Latest variant of video/audio-related playback
// For /details/[IDENTIFIER]

if (typeof(jwplayer)!='undefined'  &&  jwplayer.version){
  if     (parseInt(jwplayer.version,10) >= 7) jwplayer.key="ZV+cHpnETSSMPgD9dAAhnY6l+yhfV818mrpe4Q==";
  else if(parseInt(jwplayer.version,10) >= 6) jwplayer.key="sZbikYlI/xtW0U/3Tw1DOdjC1EahhtUCJF5KggVdqDY=";
}


(function( $ ) {

  // NOTE "getState().toUpperCase()" below is due to case change from jw6 (upper) to jw7 (lower) (see also jwv)
  
  // any methods or variables here are like private-to-outside globals and same for all create "Play objects"
  var stash={};

  // global config, for all Play objects
  var ios =(navigator.userAgent.indexOf('iPhone')>0  ||
            navigator.userAgent.indexOf('iPad')>0  ||
            navigator.userAgent.indexOf('iPod')>0);

  // playing video size for normal /details/ pages
  var VIDEO_HEIGHT=480;
  var VIDEO_WIDTH=640; //(for 4:3 aspect -- scales for other aspects)

  var CONTROLS_HEIGHT=30;
  var AUDIO_WIDTH=350;
  var AUDIO_HEIGHT=CONTROLS_HEIGHT;
  
  var CONTROLS_MAX_WIDTH=800;
  var IA_CLICK_WIDTH=24;

  var PLAYLIST_ENTRY_HEIGHT=20;
  var HEIGHT_ALIST=370; // NOTE: max height; if few list entries, will be less
  var HEIGHT_VLIST=100; // NOTE: max height; if few list entries, will be less
   
  var METADATA_HEIGHT = 100; //metadata peekaboo min height! (for "responsive")


  // [playlist] should by an array, something like (ideally) one of:
  //    [ {"file":"chapter1.mp4"}, {"file":"chapter2.mp4"}, .. ]
  //    [ {"sources":[{"file":"video.mp4"},{"file":"video.ogv"},{..}]}, .. ]
  function Play( jid, playlist, options ) {  // xxxx wrap innards with try/catch
    if (!jid){ alert('please pass in a unique identifier for this object'); return false; }
    if (typeof(stash[jid])!='undefined'){
      if (typeof(playlist)=='undefined')
        return stash[jid]; // return prior created object
      else
        delete stash[jid]; // new jwplayer + playlist for prior jid
    }
    stash[jid] = this; // stash a pointer so that a repeat call to Play(jid) returns prior object

    // variables that are *per object/instance* (and user options can override)
    var vars = {
      start:0,
      startPlaylistIdx:0,
      embed:false,
      flash:false,  // false: prefer html5 first, then flash;  true: flash only
      hide_list:false,
      autoplay:false,
      audio:false,
      width:0,
      height:0,
      responsive:false,
      noshare:false,
      logo:false, // true to force it to show
      so:false,
      tv:false,
      tvStart:0,
      tvEnd:0,
      play_just1:false,      // dont auto-advance to next playlist entry (eg: /details/oldtimeradio items)
      list_height: 0,
      skinB: false,          // bekle based, but narrower and no: HD, prev/next, duration/elapsed times, caption menu, seek/scrub bar
      skinC: false,          // bekle based, but narrower and no: HD, prev/next, duration/elapsed times
      identifier:false,      // or archive identifier when playback of specific item
      onTime: false,         // or callback to invoke on each jwplayer "onTime()" callback
      onComplete: false,     // or callback to invoke on each jwplayer "onComplete()" callback
      onDisplayClick: false, // or callback to invoke on each jwplayer "onDisplayClick()" callback
      collection : false,    // or archive identifier for most specific collection that item belongs to
      waveformer : false,    // or CSS selector string of where to manipulate an audio waveform
      details : location.href
    };
    for (var key in vars){
      // setup variable in local scope to the default value (from map above)
      var val = vars[key];
      // now, if the caller passed in value/override, use it
      if (typeof(options)!=='undefined'  &&  typeof(options[key])!=='undefined'){
        if (typeof val==='boolean' || typeof val==='number' || val===null ||  
            (typeof val==='function'  &&  key==='onTime')  ||
            (typeof val==='function'  &&  key==='onComplete')  ||
            (typeof val==='function'  &&  key==='onDisplayClick')  ||
            (typeof val==='string' && val.match(/^[a-z0-9_\.\-]+$/i))){
          val = options[key];
        }
      }
      if (typeof val==='string')
        eval('var '+key+' = "'+val+'"');
      else
        eval('var '+key+' = '+val);
    }
    
    // more (per instance) variables (cant be overridden/changed/seen by caller):
    var self = this;
    var jwcfg={};
    var readyIA = false;
    var DAR=4/3;
    var flashAnamorphic = false;
    var first_seeked_playlist = false;
    var first_onmeta = false;
    var jwwidth=0;
    var mousedover=false;
    var tvTitle = (tv  &&  playlist.length==1 ? playlist[0].title : '');
    var skin = 'six';
    var waveformed = false;
    var list_2cols = (responsive  &&  audio);
    var buttons = false;
    var jwv = parseInt(jwplayer.version,10); // eg: 6 or 7
    
    // convenient, no?
    // Stateless function, global to all Play objects
    var log = function(){
      if (typeof(console)=='undefined')
        return;
      if (location.host.substr(0,4)!='www-')
        return;
      console.log(arguments);
    };


    
    

    // xxxxxx  v6.8  obj for /details/anamorphic has wrong width in flash mode!  so squishface, unlike v6.1...
    self.adjustVideoWidth = function(player, onMetaSizing){
      
      if (player.getRenderingMode()=='flash'){
        // reset in case anamorphic videos mixed in with non...
        flashAnamorphic = false;
        
        if (player.getPlaylist().length == playlist.length){ //v6.8 -- ensure list hasnt been filtered down (seem "same_len" above)
          var sources = playlist[player.getPlaylistIndex()].sources;
          $.each(sources, function(idx,val){ // NOTE: "this" context just changed!
            // find the correct element in "sources" that is playing (bec. we may be in SD/HD toggle state!)             
            if (this.height == onMetaSizing.height){
              if (this.width > 0  &&  this.width != onMetaSizing.width){
                // think we have an anamorphic video on our hands!  reset the width...
                // eg:  /details/anamorphic
                log('playing #'+idx+', file:'+this.file+' ('+this.width+' x '+this.height+')');
                log('likely anamorphic, since metadata.width=='+onMetaSizing.width+', overridding width');
                flashAnamorphic = true;
                onMetaSizing.width = this.width;
                return false; //break
              }
            }
            return true;
          });
        }
      }


      if (onMetaSizing.height  &&  onMetaSizing.width  &&  onMetaSizing.height>0  &&  onMetaSizing.width>0  &&  (parseInt(onMetaSizing.height,10) > 0)){
        DAR = parseInt(onMetaSizing.width,10) / parseInt(onMetaSizing.height,10);
        log('DAR: '+DAR+' ['+onMetaSizing.width+'x'+onMetaSizing.height+']');
      }

      if (embed)
        self.embedResize();

    };//adjustVideoWidth()
  

    
    self.embedResize = function(){
      if (!jwplayer  ||  !jwplayer(jid))
        return;

      if (audio){
        jwplayer(jid).resize(Math.min(CONTROLS_MAX_WIDTH, $(window).width()) - IA_CLICK_WIDTH, AUDIO_HEIGHT);
        return;
      }

      // window max avail width and height for us
      var WW=$(window).width();
      var WH=$(window).height() - list_height;
      
      if (!flashAnamorphic  ||  DAR<=0){
        jwplayer(jid).resize(WW, WH);
        return;
      }

      
      
      // First see if we fit inside with max height of avail window
      var h2=$(window).height();
      var w2=Math.round(h2 * DAR);
      if (w2 > WW){
        log('FLASH! too big..');
        w2=$(window).width();
        h2=Math.round(w2 / DAR);
      }
      log('FLASH! Resize to: '+w2+'x'+h2);
      jwplayer(jid).resize(w2, h2);
      $('#'+jid).parent().css({margin:'auto'});//re-center
    };


    self.responsiveResize = function(first){
      if (!responsive)
        return;
      
      var playoff=$('#'+jid).offset();
      var maxH=$(window).height() - playoff.top - METADATA_HEIGHT; 
      if (audio){
        if (playlist  &&  playlist.length>0  &&  playlist[0].image)
          AUDIO_HEIGHT = 140; // (typically png is 800x140 now)
        // OK, so we will be using "maxH" for the **playlist**.
        // Reduce by player/waveform height now...
        maxH -= AUDIO_HEIGHT;
        maxH = Math.max(240, maxH); //... but make sure at least ~8 rows (or 4 if oldtimeradio item ;-) always show (insanely short browser??)
        if (!embed){
          log('responsiveResize() maxH:'+maxH);
          list_height = maxH;
          log($('#'+jid+'__list').length);
          $('#'+jid+'__list').css({'max-height':maxH,
                                   'overflow-x':'hidden',
                                   'overflow-y':'auto'});
        }
        width='100%';
        $('#theatre-controls .fave-share').removeClass('fave-share');
        $('#theatre-controls').offset({top:playoff.top}).css({visibility:'visible','background-color':'black'});
      }
      else{
        var aspect = DAR;
        if (playlist  &&  playlist.length>0  &&  playlist[0].sources  &&  playlist[0].sources.length>0  &&
            playlist[0].sources[0].width  &&  playlist[0].sources[0].height){
          aspect = playlist[0].sources[0].width / playlist[0].sources[0].height;
          log('aspect ratio appears to be: '+aspect);
        }
        
        var maxW=$('.container-ia:last').width();
        log('video max rect avail: '+maxW+'x'+maxH);
        
        var vidW, vidH;
        var tries=[960,840,720,600,480,360,240,180];
        for (var idx in tries){
          vidH = tries[idx];
          vidW = Math.round(vidH * aspect);
          log('video size try fit: '+vidW+'x'+vidH);
          if ((vidW <= maxW  &&  vidH <= maxH)  ||  vidW<=320)
            break;
        }
        width  = vidW;//'100%';
        height = vidH;
        if (typeof(AJS)!='undefined')
          AJS.theatre_controls_position(false, 0, width, height);
      }

      

      
      if (first){
        // we havent setup the player yet, but want to setup a watcher
        // for browser resize or mobile orientation changing
        $(window).on('resize  orientationchange', function(evt){
          $.doTimeout('play.js-'+evt.type, 250, function(){
            // resize/orient flip -- resize and reflow elements
            Play(jid).responsiveResize();
          });
        });
      }
      else{
        if (!audio)
          jwplayer(jid).resize(width,height);
      }
    };


    self.playN = function(idx, onPLI){
      var $rows=$('#'+jid+'__list').find('.jwrow, .jwrowV2');
      
      $rows.removeClass('playing');
      if (!readyIA)
        return false;

      $($rows.get(idx)).addClass('playing');
      if (!onPLI){
        var player = jwplayer(jid);
        player.playlistItem(idx);
      }

      return false;
    };


    // xxx suck, ubuntu new firefox re-seeks to start w/o double doing this, etc....
    self.seeker_playlist = function() {
      if (first_seeked_playlist)
        return;
      first_seeked_playlist = true;
      
      if (!start)
        return;
      
      log('seeker_playlist() to '+start);
      self.pause();
      jwplayer(jid).seek(start);
    };

    self.isAudio = function(){ return audio; };
    self.pause = function(){
      var jw=jwplayer(jid);
      if (readyIA  &&  jw  &&  jw.getConfig()  &&  jw.getState  &&  jw.getState().toUpperCase()=='PLAYING')
        jw.pause();
    };
    self.remove = function(){
      self.pause();
      var jw=jwplayer(jid);
      if (readyIA  &&  jw  &&  jw.getConfig())
        jw.remove();
      delete stash[jid];
    };

    
   self.addClickablePlaylist = function(){
     if (hide_list)
       return; // nothing to do!

     var player = jwplayer(jid);
     var jwlist = player.getPlaylist();
     var same_len = true;
     if (jwlist.length != playlist.length){
       log('NOTE: jw playlist filtered down -- '+playlist.length+' ==> '+jwlist.length+' items');
       same_len = false;
     }
     
     var ialist = '';
     var ialistC1 = '';
     var ialistC2 = '';
     $.each(jwlist, function(idx,val){
       if (val.title)
         val.title = val.title.replace(/^\d+\. /,'');//xxx "1. Camaro" ==> "Camaro""

       // In v6.8 flash mode (only), the duration no longer is passed back via "getPlaylist()" 8-(
       // so try the original list sent to jwplayer config if we can...
       var duration = (typeof(val.duration)!='undefined' ? val.duration :
                       (same_len  &&  typeof(playlist[idx])!='undefined'  &&  typeof(playlist[idx].duration)!='undefined' ?
                        playlist[idx].duration : 0));
       if (duration <= 0)
         duration = false;

       if (list_2cols){
         var str = ('<a href="#" onclick="return Play(\''+jid+'\').playN('+idx+')"><div class="jwrowV2">'+
                    '<b>'+(idx+1)+'</b>'+
                    '<span class="ttl">'+(typeof(val.title)=='undefined'?'':val.title)+'</span> - '+
                    '<span class="tm">'+(duration ? window.Play.sec2hms(duration) : '')+'</span>'+
                    '</div></a>');
         if (idx < (playlist.length/2))
           ialistC1 += str;
         else
           ialistC2 += str;
       }
       else{
         ialist += ('<a href="#" onclick="return Play(\''+jid+'\').playN('+idx+')"><div class="jwrow">'+
                    '<div class="tm">'+(duration ? window.Play.sec2hms(duration) : '')+'</div>'+
                    '<div class="n">'+(idx+1)+'</div>'+
                    '<div class="ttl">'+(typeof(val.title)=='undefined'?'':val.title)+'</div>'+
                    '</div></a>');
       }
     });

     if (list_2cols){
       ialist = ('<div class="row">' +
                 '<div class="col-sm-6">'+ialistC1+'</div>' +
                 '<div class="col-sm-6">'+ialistC2+'</div>' +
                 '</div>');
     }
     

     var css={}
     if (responsive){
       css['width']=width;
       css['margin']='auto';
       if (audio  &&  skin!='five'  &&  skin!='bekle'){
         // stay as wide as the player is... which has a max-width in this skin...
         css['max-width']=CONTROLS_MAX_WIDTH;
         // css['top']='-15px';//xxxxx
       }
       if (!audio)
         $('#'+jid).css('margin','auto');
     }
     
     $('#'+jid+'__list').addClass(list_2cols ? 'jwlistV2' : 'jwlist').css(css).html(ialist);

     log(playlist);
   };
    
    self.debug = function(){
      debugger;
    }
    
    
     
    
    /******* START OBJECT CONSTRUCTOR *******/
    


    if ($('#'+jid).length==0){
      log('play.js requires #'+jid+' element on page -- not found'); 
      return false; 
    }
    

    self.responsiveResize(true);
    

    
    if (identifier !== false)
      details = 'https://archive.org/details/'+identifier;
    if (tv  &&  tvEnd)
      details += '#start/'+tvStart+'/end/'+tvEnd;

    if (typeof playlist==='undefined'){
      playlist=[{sources:[{file:'/download/family-rolled/family-rolled.mp4'},
                          {file:'/download/family-rolled/family-rolled.ogv'}],
                 image:'/download/family-rolled/format=Thumbnail&ignore=x.jpg'}];
      start=true;
      hide_list=true;
    }
    

    if (!hide_list){
      if (!list_height) // if user hasn't specified...
        list_height = (audio ? HEIGHT_ALIST : HEIGHT_VLIST);
      // now drop down list_height if there aren't many playlist elements...
      list_height = Math.min(list_height, 
                             playlist.length * PLAYLIST_ENTRY_HEIGHT);
    }
    

    if (!responsive  &&  !(width>0  &&  height>0)){
      if (embed){
        var winw = $(window).width();
        var winh = $(window).height();
        width =  (audio ? Math.min(winw,CONTROLS_MAX_WIDTH) : winw);
        height = (audio ? (AUDIO_HEIGHT + list_height) : winh - list_height);
      }
      else{
        width  = (audio ?  AUDIO_WIDTH                 : VIDEO_WIDTH);
        height = (audio ? (AUDIO_HEIGHT + list_height) : VIDEO_HEIGHT);
      }
    }
    jwwidth = (audio ? (width - IA_CLICK_WIDTH) : width);
    
    


    
    if (audio  &&  embed  &&  identifier!==false){
      var audiorow =
        '<div class="iajwBG"><div id="ia'+jid+'" class="iajw"><a target="_blank" title="See more Formats at Internet Archive" data-toggle="tooltip" data-placement="left" href="'+details+'"><img src="/images/blank.gif"/></a></div></div>';
      $(audiorow).insertBefore('#'+jid);
      
      $('#ia'+jid+' a').tooltip({});
    }
    


    $.each(playlist, function(idx,val){       
      //log(val.sources);
      if (typeof(val.sources) == 'undefined'){
        if (typeof(val.file)!='undefined'){
          val.sources=[{file:val.file,height:480}];
        }
      }
      if (typeof(val.sources) == 'undefined'){
        alert(idx+': sources undefined!');//xxx
        return;
      }
      //log(val.sources);
    });
    
    
    if (!hide_list){
      var ialist = '<div id="'+jid+'__list"'+(list_2cols ? '' : 'style="height:'+list_height+'px"')+'> </div>';
      $(ialist).insertAfter('#'+jid);
    }
    
     
    if (tvTitle){
      // remove the end time (for brevity) for the "click to play" center button
      playlist[0].title = playlist[0].title.replace(/( \d+:\d+[amp]+)\-\d+:\d+[amp]+ /, '$1 ');
    }
    

    
    if (jwv==7  &&  playlist[0].image)
      playlist[0].image = playlist[0].image.replace(/%2F/g,'/'); // for jwplayer v7+
    
    jwcfg={
     // *could* consider this if we think jwplayer playlists are reasonble in v6.8 now....
     // "listbar":{layout:'basic',position:'bottom',size:list_height},
     "playlist": JSON.parse(JSON.stringify(playlist)), // deep copy, since jwplayer v6.8 *changes* our list on us!
     "analytics":{ enabled:false, cookies:false }, // dont track our users xxx
     "abouttext":'this item, formats, and more at Internet Archive',
     "aboutlink":details,
     "startparam":"start",
     "logo":{},
     "sharing":{},
     "autostart": (autoplay),//  ||  (start && !ios) ? true : false),
     "fallback": (so ? false : true),
      "width"        :(isNaN(jwwidth) ? '100%' : jwwidth),
     "height"        :(audio ? 30 : height)// + list_height // *could* consider this if we think jwplayer playlists are reasonble in v6.8 now....
    };
    //alert(width+' x '+height+'/'+list_height);

    if (responsive  &&  !embed){    
      jwcfg.displaytitle = false; // dont show title of 1st track next to big PLAY button
    }
    
    if (responsive  &&  audio  &&  !embed){
      jwcfg.displaytitle = false; // dont show title of 1st track next to big PLAY button
      skin = 'bekle';
      // allow user (for now) to pick 1 of 8 skins (six.xml is builtin default)
      var skinarg = location.search.match(/\?skin=(\d+)/);
      if (skinarg  &&  skinarg.length){
        var skins=['beelden','bekle','five','glow','roundster','stormtrooper','vapor'];
        skin = skins[skinarg[1] % skins.length]
      }
      if (skin=='bekle')
        jwcfg.skin = '/jw/6.8/bekleA.xml';
      else
        jwcfg.skin = '/jw/6.8/skins/'+skin+'.xml';
      log('TRYING SKIN: '+jwcfg.skin);
      if (skin=='five'  ||  skin=='bekle')
        jwcfg.stretching = 'exactFit';
    }
    
    
    
    if (identifier!==false){

      var embedcode = '<iframe src="https://archive.org/embed/MEDIAID" width="'+(audio?500:VIDEO_WIDTH)+'" height="'+(audio?AUDIO_HEIGHT:VIDEO_HEIGHT)+'" frameborder="0" webkitallowfullscreen="true" mozallowfullscreen="true" allowfullscreen></iframe>';//xxx check if multiple identifiers....
      var embedcodeWP = '[archiveorg '+identifier+(tv && tvEnd ? '?start='+tvStart+'&end='+tvEnd:'')+' width=640 height='+(audio?AUDIO_HEIGHT:VIDEO_HEIGHT)+' frameborder=0 webkitallowfullscreen=true mozallowfullscreen=true]';
      embedcode = embedcode.replace(/embed\/MEDIAID/, 'embed/'+identifier+(tv && tvEnd ? '?start='+tvStart+'&end='+tvEnd:'')); //xxx *SHOULD* be able to just encode "embedcode" like iatest.js does, WTF?!?!!
      jwcfg.mediaid = identifier;
      if (!noshare  &&  !audio)
        jwcfg.sharing.code = encodeURI(embedcode); 
      if (audio)
        jwcfg.embedcode = embedcode; // (IA extension used by play.js)

      // IFF these exist, fill them in!
      $('#embedcodehere'  ).text(embedcode  );
      $('#embedcodehereWP').text(embedcodeWP);
    }
    if (!noshare  &&  !audio)
      jwcfg.sharing.link = details;//xxx check if multiple identifiers.... //xxx *SHOULD* be able to just us "jwplayer().getConfig().sharing.code" like iatest.js does, WTF?!?!!
    if ((jwv!=7  &&  responsive  &&  !embed)  ||  (typeof(jwcfg.sharing.link)=='undefined' && typeof(jwcfg.sharing.code)=='undefined'))
      delete jwcfg['sharing'];

    if (jwcfg.sharing){
      buttons = true;
      if (jwv==7)
        jwcfg.sharing.sites=['facebook','twitter','pinterest','tumblr','reddit','googleplus','email'];
    }
    
    if (!audio  &&  collection  &&  !tv)
      jwcfg.related={ file: "/services/collection-rss.php?collection="+collection };
    
    if (ios  &&  audio)
      jwcfg.mobilecontrols = true;  //turn of iOS native controls and go w/ JW controls xxx
    
    if (flash)
      jwcfg.primary = 'flash';
    
    if (skinB) jwcfg.skin = "/jw/6.8/bekleB.xml";
    if (skinC) jwcfg.skin = "/jw/6.8/bekleC.xml";
    
    if ((embed  &&  !audio)  ||  logo){
      jwcfg.logo={
        file: "//archive.org/jw/6.8/glogo-ghost.png",
        link: details,
        position:'bottom-right',
        margin:2,
        hide:false
      };
    }

    if (!audio  &&  !embed){
      // later, if playing in flash mode *and* we determine the video is anamorphic,
      // we need to set this now so we stretch "disproportionally" to our correctly figured width/height
      // Would *prefer* to only set this if we detect flash and anamorphic, but we can't apply this
      // flash setting later in v6.8 anymore...
      //jwcfg.stretching = "exactFit"; // bleah Jan12,2014 -- cant do this w/o breaking *all* fullscreen !16x9 videos on 16x9 monitors...  reverting to anamorphic video is wrong aspect when in flash mode (jw bug -- no workaround now)
    }


    
    if (play_just1  &&  !onComplete){
      // dont wanna auto-advance to next track in playlist
      onComplete = function(jw){
        jw.stop(); 
      };
    }
        

    log(jwcfg);
    jwplayer(jid).setup(jwcfg);
    jwplayer(jid).onReady(function(){

      log('IA '+jid+' is ready');
      log('NOTE: JW version: ' +jwplayer.version+ ', Rendering mode: ' + this.getRenderingMode());
      if (onTime)
        log('NOTE: onTime() is in use!');

      
      if (onTime)        this.onTime(            function(){ onTime(             this); });
      if (onComplete)    this.onComplete(        function(){ onComplete(         this); });
      if (onDisplayClick)this.onDisplayClick(    function(){ onDisplayClick(     this); });
      
      readyIA = true;
      
      // NOTE: we now do this here because jwplayer can shrink down the passed in playlist on us!
      self.addClickablePlaylist();

      if (audio  &&  responsive  &&  !embed)
        self.responsiveResize();
      
      
      
      // trap for SPACE key press to toggle pause/play
      var player=this;
      $('#'+jid).parent().mouseover(function(e) { mousedover=true; });
      $('#'+jid).parent().mouseout (function(e) { mousedover=false; });
      $(document).keyup(function(e) {
        if (e.keyCode==32  &&  mousedover){
          player.pause();
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        return true;
      });


      if (responsive  &&  !audio)
        $('#'+jid).css('margin','auto');
      

      var flashy = (this.getRenderingMode()=='flash');
      if (audio){
        $('#'+jid).css({'min-height' : AUDIO_HEIGHT}); // bug IMHO in jwplayer -- for all mobile sets to 200!!
        
        if (responsive){
          if (AUDIO_HEIGHT > CONTROLS_HEIGHT){
            if (flashy){
              $('#'+jid+'_wrapper').height(AUDIO_HEIGHT); // bug in jwplayer -- flash height set right, but parent/container wrong!
            }
            else{
              $('#'+jid+' .jwcontrolbar').show().fadeTo(0,1); //xxx force controlbar to always show when using waveforms!
              this.resize(this.getWidth(), this.getHeight()); //xxx force controlbar to always show when using waveforms!
            }
          }
        }
        else{
          if (flashy)
            $('#'+jid).parent().parent().find('.iajw,.iajwBG').css({visibility:'visible'});
          else
            $('#'+jid).parent().find('.iajw,.iajwBG').css({visibility:'visible'});
        }
      }
      else{
        if (embed){
          var butid='btn1';
          var ttl = (tvTitle ?
                     tvTitle.replace(/ : /g,"\n") + "\n\nClick above for more information and clips\nat the Internet Archive" :
                     "More Formats from Internet Archive");
          
          this.addButton("/images/glogo20x20.png",ttl, function(){window.top.location.href=details;}, butid);
          if (tv){
            if (options.tvSource!==false){
              this.addButton("/images/tv/"+(identifier.split('_')[0])+".png", 'Look for this show on '+(options.tvContributor)+" website", function(){window.top.location.href=options.tvSource;}, "btn2");
              buttons = true;
            }
           
            $('#'+jid+'_dock_'+butid+'_tooltip  .jwcontents').css({'white-space':'pre-wrap'});//fix for newlines in html5 mode (only text not HTM newlines work in flash)
          }
        }
        

        if (embed  &&  !noshare  &&  !tv  &&  identifier!==false){
          this.addButton("/jw/6.8/embed.png","Embedding Examples and Help", function(){window.top.location.href="/help/video.php?identifier="+identifier;}, "btn2");
          buttons = true;
        }
      }
      

      if (!responsive  &&  !audio  &&  !embed  &&  typeof($.cookie)!='undefined'){
        var hover=(flashy ? "Click to have player try HTML5 first, then flash second" :
                   "Click to have player try flash first, then HTML5 second");
        
        this.addButton('/jw/6.8/flash.png', hover, function(){
          if (flashy)
            $.cookie('avpref2',null,{path:'/'});
          else
            $.cookie('avpref2','flash',{path:'/'});
          
          window.top.location.href=location.href
        }, "btn3");
        buttons = true;
      }

     
      if (!autoplay  &&  start){
        log('seek #'+startPlaylistIdx+' to '+start);
        this.playlistItem(startPlaylistIdx);
      }


      if (!embed  &&  !flashy  &&  !buttons)
        $('body').addClass('jw_nodock');

      if (responsive  &&  !embed  &&  !audio  &&  typeof(AJS)!='undefined')
        AJS.theatre_controls_position(false, 0, width, height);
    })
    .onMeta(function(obj){
      // only call all this once, because sometime between Feb and May 2014,
      // firefox+flash start sending onMeta() *very* frequently, not just once,
      // and we need to only "first seek" once, especially!
      if (!first_onmeta){
        first_onmeta = true;

        log('onMeta() fired');
        
        $('body').addClass('responsive-playing');

        
        if (!audio  &&  embed  &&  obj.width  &&  obj.height)
          self.adjustVideoWidth(this, obj);

        
        // xxx suck, ubuntu new firefox re-seeks to start w/o double doing this, etc....
        if (start){
          log('SEEK TO: '+start);
          self.pause();
          jwplayer(jid).seek(start);
        }
      }
    })
    .onPlaylistItem(function(obj){

      log('onPlaylistItem: ' + obj.index);

      self.playN(obj.index, true);
      self.seeker_playlist();


      
      if (waveformer  &&  !waveformed){
        var flashy = (this.getRenderingMode()=='flash');
        var $wrapme = $('#'+jid);
        if (flashy)
          $wrapme = $wrapme.parent();
        $wrapme.wrap('<div id="'+waveformer+'" style="position:relative"></div>');
        
        var jWD = $('#'+waveformer).width();//xxxx-xxxx deal w/ browser resize and orientation changes
        var jHT = $wrapme.height();
        $('#'+waveformer).prepend('<div id="waveformer" style="background-color:rgb(19,160,216); position:absolute; width:0; height:'+jHT+'px;">');
          
        this.onTime(function(evt){
          if (!evt.duration)
            return;
          $('#waveformer').css({ width: Math.round(jWD * (evt.position / evt.duration))});
        });

        waveformed = true;
        
        setTimeout(function(){
          if (!flashy)
            $('#'+jid).css('background-color','transparent');
          $('#'+waveformer).css('background-color','#ddd');      
        },1000);
      }
    })
   .onError(function(obj){
     log('err');
     log(obj);
     $('#'+jid).css({'background-color':'black'});
     //throw "onError event";
   });
    
    

    setTimeout(function(){
      var $e=false;

      if (!jwplayer  ||  !jwplayer(jid)  ||  typeof(jwplayer(jid).getRenderingMode)=="undefined"){

        if (so){
          $e=$('<div />')
            .attr({'class':'text-danger','style':'text-align:center;background-color:white'})
            .html('Looks like you cannot play our media.<br/>You may have a better experience with a newer browser like <a href="http://mozilla.org/firefox">Firefox</a> or install/update <a href="http://www.adobe.com/go/getflash/">Flash</a>');
        }
        else{
          $e=$('<div />')
            .attr({'class':'text-danger','style':'text-align:center;background-color:white'})
            .html('Guessing you cannot play our media?<br/>'+
                  'Your browser may be too old to play html5 video tags *and* does not have the flash plugin, is disabled, or is a very old version of flash?<br/>'+
                  '<a href="http://www.adobe.com/go/getflash/">Get current Flash version</a>');
        }

        if (embed)
          $e.insertBefore($('#'+jid));
        else
          $e.insertAfter($('#'+jid));
      }
    },15000);//15 seconds

    
    /****** END OF OBJECT CONSTRUCTOR ******/
    return this;
    
  }; // end function Play()

   
  Play.prototype.constructor = Play; // make it so we can do "new Play()" internally (only)

  window.Play = function(id,playlist,options) { return new Play(id,playlist,options); }; // make it so we can do "new Play(..,..)" globally






   
  // From here on down, these methods are like "class" and not "instance" methods


  // returns number of seconds (may be float) as string "hh:mm:ss"
  // note will omit "hh:" if 0.
  // Stateless function, global to all Play objects
  window.Play.sec2hms = function(sec){
    sec = Math.round(sec);
  
    var hr = Math.floor(sec/3600);
    var min= Math.floor((sec - (hr*3600))/60);
    sec -= ((hr*3600) + (min*60));
    
    // left 0-pad to 2 digits as needed
    var hms='', tmp='';
    if (hr > 0)
    {
      tmp = '00'+hr;
      hms += tmp.substr(tmp.length-2, 2)+':';
    }
    tmp = '00'+min;
    hms += tmp.substr(tmp.length-2, 2)+':';
      
    tmp = '00'+sec;
    hms += tmp.substr(tmp.length-2, 2);
      
    return hms;
  };


  // [nicked from jwplayer JS v6 code]
  // Converts a time-representing string to a number.
  // @param {String}      The input string. Supported are 00:03:00.1 / 03:00.1 / 180.1s / 3.2m / 3.2h
  // @return {Number}     The number of seconds.
  window.Play.seconds = function(str) {
    str = str.replace(',', '.');
    var arr = str.split(':');
    var sec = 0;
    if (str.substr(-1) == 's') {
      sec = Number(str.substr(0, str.length - 1));
    } else if (str.substr(-1) == 'm') {
      sec = Number(str.substr(0, str.length - 1)) * 60;
    } else if (str.substr(-1) == 'h') {
      sec = Number(str.substr(0, str.length - 1)) * 3600;
    } else if (arr.length > 1) {
      sec = Number(arr[arr.length - 1]);
      sec += Number(arr[arr.length - 2]) * 60;
      if (arr.length == 3) {
        sec += Number(arr[arr.length - 3]) * 3600;
      }
    } else {
      sec = Number(str);
    }
    return sec;
  };


  // stops any playing clip
  window.Play.mwpause = function()
  {
    if (typeof(jwplayer)!='undefined')
    {
      var jw=jwplayer('jw6');
      if (jw  &&  jw.getState  &&  jw.getState().toUpperCase()=='PLAYING')
        jw.pause();
      return jw;
    }
    return false;
  };


  // keep this method "private"
  var insertCommentFromForm = function() 
  {
    var nComments = $('#comments .comment').length - 1;
        
    // we know the last row is a hidden blank row; copy it..
    var $blankrow=$($('#comments > div').get(-1)).clone();
    // now update the parts we need to...
    var stime = parseInt($('#start').val(),10);
    $blankrow.find('.content').html($('#comment').val());
    $blankrow.find('.comtime').html(window.Play.sec2hms(stime));
    $blankrow.html($blankrow.html().replace(/#start\/0/, '#start/'+stime));
    $('#comments').prepend($blankrow);
    window.Play.clipping(1);  // clear and hide the comment maker.  restart vid.
    $blankrow.show(1000, function(){ // show your new comment!
    
      // now this is just kinda showing off...
      // find the row where we should move the comment to, if not where it is now
      if (nComments > 0)
      {
        // 2nd to last comment is last "real" comment
        var $commentAfter=$($('#comments .comment').get(-2));
        $('#comments .comment').each(function(idx,obj){
          var link = $(obj).find('a.seekjs').get(0);
          var mat = link.href.match(/#start\/([\d\.]+)/);
          if (mat)
          {
            var sec=mat[1];
            if (parseFloat(sec) > stime)
            {
              // if 0, already at top!
              if (idx!=0)
              {
                $commentAfter = $(obj);
                
                var $newrow = $blankrow.clone();
                $newrow.hide();
                $newrow.insertBefore($commentAfter);
                $newrow.show(2000);
                $blankrow.hide(2000, function(){
                  $blankrow.remove();
                });
              }
              return false; // break;-)
            }
          }
          return true;
        });
      }
    });
  };


  window.Play.clipcheck = function()
  {
    if (!$('#comment').val())
    {
      alert('Please enter a comment for your video clip');
      return false;
    }

    
    var start = $('#start').val();
    
    if (start=='')
    {
      alert('Please begin playing the video to anchor your comment at a time');
      return false;
    }
    
    if (!parseFloat(start))
      return false;


    // now we need to process the comment and show it on screen
    var $form=$($('#clipthis').find('form').get(0));
    var formstring = $.param($form.serializeArray());
    
    $.get('/bookmarks.php?'+formstring, function(data){
      if (data=='{"msg":"Favorite sucessfully added!"}')
      {
        insertCommentFromForm();
      }
      else
      {
        alert('failed to save comment.  try again later?');
      }
    });
    
    return false;
  };

  
  window.Play.clipping = function(loggedin)
  {
    if (!loggedin){
      window.Play.mwpause();
      alert('You need to be a logged in user in order to make a comment.  See the "log in" or "join us" links next to the "Add a Comment" section');
      return false;
    }
    
    // if want *both* in/out again, consider buttons like
    // /images/resultset_previous.png   /images/resultset_next.png
    $('#clipthis').toggle(); 
    $('#cliplink').toggle(); 
    var showing = $('#clipthis').css("display")!='none';

    var player = jwplayer();
    if (showing  &&  player.getState().toUpperCase()=='PLAYING')
      player.pause();
    if (!showing  &&  player.getState().toUpperCase()=='PAUSED')
      player.play();
    
    if (!showing)
      $('#comment').val(''); 
    
    return false;
  };


  
  
  window.Play.seek = function(link)
  {
    var mat=(link.href+'/').match(/[\/#]start\/([\d\.]+)\//);
    if (!mat)
      return true;
    var startsec=mat[1];
    jwplayer().seek(startsec);
    location.href=link.href;
    return false;
  };
  

  /*
  // trap for ESCAPE key pressed to close a popup
  $(document).keydown(function(e) {
    if (e.keyCode==27)
      $('#jpop').remove();
  });
  */
    
  // var flashable_version = (typeof(jwplayer)!='undefined' && jwplayer.utils && typeof(jwplayer.utils.flashVersion)=='function' && jwplayer.utils.flashVersion());
   
  /* window.Play.except = function(e)
  {
    // report back home an exception was thrown!
    var img = new Image(1,1);
    img.src =
      "http://analytics.archive.org/e.gif" +
      "?a="+ encodeURIComponent(navigator.userAgent) +
      '&e='+ encodeURIComponent(e.toString()) +
      (e.stack  &&  typeof(e.stack)=='string' ?
       '&s='+ encodeURIComponent(e.stack) : '');
  }
  */
  
   
}( jQuery ));
