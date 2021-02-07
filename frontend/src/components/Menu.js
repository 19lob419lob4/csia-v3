import React from 'react';
import './Menu.css';
import uniqid from 'uniqid'
import axios from 'axios';

const domain = 'http://3.12.162.222'
//during development localhost was used...
//const domain = 'http://localhost:8080'

class Menu extends React.Component {
  
  constructor(props){
    super(props)
    this.state = {
        loggedIn: this.props.loggedIn,
        loadingData: true,
        subjects:null,
        newSubject:'',


        subjectFocus:false,
        subjectData: null,
        activeSubject: 0,
        activeTopic: 0,

        addSubjectMode: false,
        addSubject:'',
        deleteSubjectMode: false,

        addSubtopicMode: false,
        addSubtopic:'',
        

        keywords: ['is','are','because'],

        editMode: false,
        editValues: [], //for editing input in react...
        editingObj: -1,
        editPos: [0,0],  
        newEdit: false,
        newEditValue: '',

        flashcardMode: false,
        flashcardDeck:[],
        activeDeck: 0,
        openDeck: false,
        flashcardZPos: [],
        doneCards: [],
        doneCount:0,
        cardReveal:false

    }
    this.addSubject = this.addSubject.bind(this);
    // this.cancelAddSubject.bind = this.cancelAddSubject.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.changeEditValue = this.changeEditValue.bind(this);
    this.updateSubjects = this.updateSubjects.bind(this);


    this.addSubtopic = this.addSubtopic.bind(this);
    this.removeSubtopic = this.removeSubtopic.bind(this);

    this.updateSubtopics = this.updateSubtopics.bind(this);
    this.removeSubject = this.removeSubject.bind(this);
    this.addEditObj = this.addEditObj.bind(this);
    this.loadFlashcardDeck = this.loadFlashcardDeck.bind(this);
    this.rotateFlashcard = this.rotateFlashcard.bind(this);

  }

  //this function is used to handle changes made in the invidual edit object fields when intially loaded (single note textarea - ie. apple is red )
  handleChange(x,event){
    let currentValues = this.state.editValues;
    currentValues[x] = event.target.value;
    //due to the nature of react, when a state is updated, components are refreshed, which results in the blurring (unfocsing) from textareas
    //to fix this, the function below is added, changing the editPos, such that focus/carcet position is regained after state update
    this.setState({editValues:currentValues, editingObj:x, editPos:[event.target.selectionStart,event.target.selectionEnd]})

  }

  //update addSubject state value so it is ready for post request
  addSubject(e){
    this.setState({addSubject:e.target.value})
  }

  //update addSubtopic state value so it is ready for post request
  addSubtopic(e){
    this.setState({addSubtopic:e.target.value})
  }

  //this function is used to handle changes made in the invidual edit object fields that are added ( not initially loaded - new notes )
  changeEditValue(event){
   this.setState({newEditValue:event.target.value})
  }

  //when the component first loads or 'mounts', the below functions are ran
  async componentDidMount(){
    //get request for data
    this.getData()

    //due to the nature of react, when a state is updated, components are refreshed, which results in the blurring (unfocsing) from textareas
    //to fix this, the function below is added, changing the editPos, such that focus/carcet position is regained after state update

    window.addEventListener("keyup",()=>{
      let editobj = document.getElementById('e' +this.state.editingObj);

      if(editobj!=null){
        editobj.focus()
        editobj.selectionStart=this.state.editPos[0];
        editobj.selectionEnd=this.state.editPos[1];
      }

    })
    
  }

  //sends get request to express server
  async getData(){
    axios.get(domain + '/subjects')
        .then(response =>{   
            let data = response.data;
            //if data is sucessfully retrieved then the subjects state is updated and loadingData is set to false
            this.setState({subjects:data, loadingData:false});

        })
        .catch(error =>{
            console.log(error)
        })
  }

  //this was implemented to fix the subtopics menu not updating after deleting subtopics. 
  //the reason behind this was that the get request only updated the data when exiting editing interface or reloading
  //the fix was to request specific data upon modifying the available suptopics
  async updateSubjectData(){
    axios.get(domain + '/subjects')
    .then(response =>{   
        let data = response.data;
        this.setState({subjectData:data[this.state.activeSubject]});

    })
    .catch(error =>{
        //console.log(error) //return error fail to retrieve data
    })
  }


  //this is used to switch through subtopics in the subtopic menu
  //x is an integer
  //x is a certain number assigned to the array of subtopic objects using the .map function
  //for example if the array had [a,b,c]
  //the indivudal divs would be:
  // <div key=0 switchTopic(0)>a</div> 
  // <div key=1 switchTopic(1)>b</div> 
  // <div key=2 switchTopic(2)>c</div> 
  switchTopic(x){
    //the topic rendered is governed by the activeTopic sate
    this.setState({activeTopic:x})

    //below is a loop that renders the notes within the topic object subtopics exist
    let values = [];
    //if statement to debug undefined error in new subjects where no subtopics exist
    if(typeof (this.state.subjects[this.state.activeSubject].topics[x]) != 'undefined'){
      let statementList = this.state.subjects[this.state.activeSubject].topics[x].content;
      //below is a for loop that checks for a presence of a keyword in the note and adds it to values array for rendering
      for(let i=0; i<statementList.length; i++){
        let before = statementList[i].before;
        let keyword = statementList[i].keyword ==-1?'':this.state.keywords[statementList[i].keyword];
        let after = this.renderARE(statementList[i].after);

        //converts content object into readable text on the interface
        values.push(before + ' ' + keyword + ' ' + after);        
      }
    }

    this.setState({editValues:values});
  }

  //this is specific for the ARE keyowrd as ARE means that there is more than one answer and the rendering is updated such that a plus + sign is added in between the words
  renderARE(items){
    let result =''

    for(let i=0; i<items.length; i++){
      result+=items[i]
      if(i!=items.length-1){
        result+=' + '
      }
    }

    return result
  }

  //this is opposite to the function above, coverting the text from the interface into a content.after array
  saveARE(areString){
    var areArr = areString.split(' + ');
    return areArr;
  }
  
  //this function follows the same idea as switchTopic(x), but for the subjects in the general subject menu
  loadSubject(x){

    if(this.state.deleteSubjectMode==false){
      this.setState({activeSubject:x, subjectData:this.state.subjects[x]})

      if(this.props.mode==0){
        this.setState({subjectFocus:true, flashcardMode:false})
      }else{
        this.setState({flashcardMode:true, subjectFocus:false})
      }
  
      //setup editable content...
      let values = [];
      
      let statementList;

      if(this.state.subjects[x].topics[this.state.activeTopic]!=undefined){
        statementList = this.state.subjects[x].topics[this.state.activeTopic].content;
        for(let i=0; i<statementList.length; i++){
          let before = statementList[i].before;
          let keyword = statementList[i].keyword ==-1?'':this.state.keywords[statementList[i].keyword];
          let after = this.renderARE(statementList[i].after);
    
    
    
          values.push(before + ' ' + keyword + ' ' + after);        
        }
      }


  
      this.setState({editValues:values});
    }
  }

  //sends post request to update subjects
  updateSubjects=async(e)=>{
    e.preventDefault();
    axios.post(domain + '/subjects/',{subjectName:this.state.addSubject})
      .then(response => {
        //console.log(response)
      })
      .catch(error =>{
        //console.log(error)
      })
    this.forceUpdate();
    this.setState({addSubjectMode:false,addSubject:''})
    setTimeout(()=>this.getData(),100);
  }

  //sends post request to update subtopics of a subject
  updateSubtopics = async(e)=>{
    e.preventDefault();

    let newsubtopic = this.state.addSubtopic;

    let postAddress = domain + '/subtopics/' + this.state.subjectData._id;
    
    axios.post(postAddress,{topicName:newsubtopic})
      .then(response => {
        //console.log(response)
      })
      .catch(error =>{
        //console.log(error)
    })

    //dynamically update data using forceUpdate
    this.forceUpdate();

    //update static data prior to subtopic data get request
    let staticTopics = this.state.subjects[this.state.activeSubject].topics;
    staticTopics.push({
      topicName:this.state.addSubtopic,
      content:[]
    })

    let updatedStaticData= this.state.subjects;
    updatedStaticData[this.state.activeSubject].topics = staticTopics;

    //update static data in the state before save (and update dynamically with the get request)
    this.setState({addSubtopicMode:false,addSubtopic:'',subjects:updatedStaticData,activeTopic:this.state.activeTopic+1});
    
    this.switchTopic(this.state.activeTopic)
    
  }

  //delete request to remove a subtopic
  removeSubtopic=async(e)=>{
    e.preventDefault()

    let deleteAddress = domain + '/subtopics/' + this.state.subjectData._id;;
    axios.put(deleteAddress,{deleteIndex:this.state.activeTopic})
      .then(response => {
        //console.log(response)
      })
      .catch(error =>{
        //console.log(error)
    });
    
    //get data such that interface will be updated once exited back to main subject menu
    this.forceUpdate();
    setTimeout(()=>this.getData(),100);

    //update subtopic data statically
    let staticTopics = this.state.subjects[this.state.activeSubject].topics;

    staticTopics.splice(this.state.activeTopic,1);

    let updatedStaticData= this.state.subjects;
    updatedStaticData[this.state.activeSubject].topics = staticTopics;

    this.switchTopic(0)
    this.setState({subjects:updatedStaticData,activeTopic:0})
    
    //update subtopic data dynamically
    setTimeout(()=>this.updateSubjectData(),100);
    this.forceUpdate();
    
  }

  //delete request to remove a subject
  removeSubject=async(id,e)=>{
    e.preventDefault();
    let deleteAddress = domain + '/subjects/' + id;
    axios.delete(deleteAddress,{id:id})
      .then(response => {
        //console.log(response)
      })
      .catch(error =>{
        //console.log(error)
      })
    this.forceUpdate();
    //
    setTimeout(()=>this.getData(),100);
    this.forceUpdate();
  }

  //adding new edit object (note content object - ie.'apple is red') to the state
  addEditObj(){
    if(this.state.newEditValue!=''){
      this.setState({newEdit:true})
    
      let currentValues = this.state.editValues;
      currentValues.push(this.state.newEditValue);
      
      //clears existing states of previous editValue that was being edited
      this.setState({editValues:currentValues, newEditValue:'', newEdit:false})
  
      //refocus after state update
      var addEditObj = document.getElementById('addEditObj');
      addEditObj.value = ''
      addEditObj.focus();
    }

  }

  //process edits and send put request to update data
  saveEdits=async(e)=>{
    e.preventDefault();
    //checking which statements contains keyword (is, are, because)

    let updatedStatements = [];

    for(let j=0; j<this.state.editValues.length; j++){
      let keywordStatement = null; 
      for(let i=0; i<this.state.keywords.length; i++){
        let keyword = this.state.keywords[i]
        let keywordIndex = this.state.editValues[j].indexOf(' '+ keyword + ' ')

        if(keywordIndex!=-1){
          //shows where to cut statements...

          let before = this.state.editValues[j].substring(0,keywordIndex);

          let after = this.state.editValues[j].substring(keywordIndex+keyword.length+2);

          let afterARR = this.saveARE(after);
          //update keywordStatements

          let updateStatus;
          //checks if there is now a keyword in previous/new editObjects
          if(typeof(this.state.subjects[this.state.activeSubject].topics[this.state.activeTopic].content[j])=='undefined'){
            updateStatus = 0
          }else if(this.state.subjects[this.state.activeSubject].topics[this.state.activeTopic].content[j].status==1){
            updateStatus = 0
          }
          
          else{
            updateStatus = this.state.subjects[this.state.activeSubject].topics[this.state.activeTopic].content[j].status;
          }

          //status(for flashcard) definitions... (0 - valid card, 1 - invalid)
          
          keywordStatement = {before:before, keyword:i, after:afterARR, status:updateStatus};

          break;
        }
        
      }
      if(keywordStatement!=null){
        updatedStatements.push(keywordStatement)
      }else{
        //checks for excess whitespace
        if(!(!this.state.editValues[j].replace(/\s/g, '').length)){
          //adds the new content object to updatedStatements array
          updatedStatements.push({before:this.state.editValues[j], keyword:-1, after:[], status:1})
        }
      }
    }
    //update database...
    let currentData = this.state.subjectData;

    //replace previous subtopic content with new updatedStatements
    currentData.topics[this.state.activeTopic].content = updatedStatements;
    
    ////console.log(currentData)

    let putAddress = domain + '/subjects/' + this.state.subjectData._id;
    axios.put(putAddress,currentData)
      .then(response => {
        //console.log(response)
      })
      .catch(error =>{
        //console.log(error)
      })
    

    //return back to menu
    this.setState({editMode:false, editValues:[]})
    this.forceUpdate();
    this.switchTopic(this.state.activeTopic)
    this.forceUpdate();
  }

  //loads flashcards
  loadFlashcardDeck(x){
    this.forceUpdate();
    //declare data in variable deckData
    let deckData = this.state.subjectData.topics[x].content;

    let finalDeckData = []

    //adds flashcards
    for(let i=0; i<deckData.length; i++){
      //checks if the flashcard has a keyword (if the note can be converted to the flaschard or not)
      if(deckData[i].status!=1){
        finalDeckData.push(deckData[i])
      }
    }

    let zPos = [];
    let doneCards = [];

    //creates z-index array according to number of valid cards
    for(let z=0; z<finalDeckData.length; z++){
      zPos.push(z);
      doneCards.push('grid');
    }

    this.setState({flashcardDeck:finalDeckData, flashcardZPos:zPos, doneCards:doneCards, openDeck:true})
  }

  //allows flashcards to appear above one another and rotate
  rotateFlashcard(doneCard){
    //doneCard is boolean value
    //check if card is 'good' or 'again' for user...

    if(doneCard){
      //get card index using the zpos...
      //ie if [2,3,4,0,1]...current top card is at index 3 which is 4 the greatest number...
      //the gratest number = length of zpos array-1

      let cardIndex = this.state.flashcardZPos.indexOf(this.state.flashcardZPos.length-1);

      //now update the doneCards array...to display none at cardIndex

      let currentCards = this.state.doneCards;
      currentCards[cardIndex] = 'none';

      let doneCount = this.state.doneCount;
      doneCount++;

      this.setState({doneCards:currentCards,doneCount:doneCount}) 
    }

    //finally rotate the card z positions...no matter if it is 'good' or 'again'
    let currentZpos = this.state.flashcardZPos;
    let topZpos = currentZpos[0];
    currentZpos.shift();
    
    currentZpos.push(topZpos);

    this.setState({flashcardZPos:currentZpos, cardReveal:false})

  }

  //progressbar function depending on the number of flascards left over
  progressBar(){
    //use of grid-template style property to seperate into sections by number of flashcards
    let template = 'repeat(' + this.state.doneCards.length + ',1fr)'

    let style = {
      gridTemplateColumns: template
    }
    return style;
  }

  //fills in the progressbar as flashcards are completed
  progressBarInner(){
    let gridColumn;

    let style;

    if(this.state.doneCount==0){
      style = {
        background:'transparent'
      }
    }else{
      //ie if there are 4 cards...
      //when one is completed gridColumn property = 1/2
      //when two is completed gridColumn property = 1/3
      //...until 1/(4+1)
      gridColumn= '1/' + (this.state.doneCount + 1);

      style = {
        gridColumn: gridColumn
      }
    }
    return style;
  }

  //depending on keyword, different premodifier for quetsion is used...
  flashcardQuestion(key){

    let premodifer;
    //ie. if keyword is 'Because' then "Why...", else if "ARE or is", "What..."
    if(key==2){
      premodifer = 'Why '
    }else{
      premodifer = 'What ' + this.state.keywords[key] + ' '
    }

    return premodifer
  }

  render(){
    //render subjects
    let renderSubjects;
    //checks if the data has been retrieved and if the mode is notes-mode
    if (this.state.loadingData==false && this.state.flashcardMode==false){
      renderSubjects = this.state.subjects.map((subject,x) =>
        <a 
        className='subjectItem' 
        key={uniqid()} 
        style={this.props.mode==0?{background: 'linear-gradient(to bottom, royalblue, royalblue 60%, #d3d3d3 60%, #d3d3d3 100%)'}:{background: 'linear-gradient(to bottom, red, red 60%, #d3d3d3 60%, #d3d3d3 100%)'}}
        //as explained above...the loadSubject(x) is used below in this .map function
        onClick={()=>{this.loadSubject(x)}}
        >

          <button 
          style = {this.state.deleteSubjectMode?{display:'grid'}:{display:'none'}}
          //each subject as a delete button that passes their own speicic subject id...this is only possible because of the .map function
          className="deleteSubject" onClick={(e)=>this.removeSubject(subject._id,e)}><span>X</span></button>
          
          <p>{subject.subjectName}</p>

          <p style={this.props.mode==0?{color:"royalblue"}:{color:'red'}}
          >{subject.topics.length} Topics</p>
  

        </a>
     
        )
    }


    //menu that maps each menu item to switchTopic(x) once again
    let focusMenu;
    if(this.state.subjectFocus){
      let subtopics = this.state.subjectData.topics;
      focusMenu = subtopics.map((item,x) =>
        <a key={uniqid()} onClick={()=>this.switchTopic(x)}>{item.topicName}</a>
      );
    }




    let content;

    if((this.state.subjectFocus)&&(this.state.subjectData.topics[this.state.activeTopic]!=undefined)){
      let statementList = this.state.subjectData.topics[this.state.activeTopic].content;
      //loads content converting them each note according to the content object
      content = statementList.map((statement, x)=>
        <div className='contentObj' key={uniqid()}>
          <p>{statement.before}&nbsp;
          {statement.keyword==-1?(<span style={{display:'none'}}></span>):(<span>{this.state.keywords[statement.keyword]}</span>)}
          &nbsp;{this.renderARE(statement.after)}</p>
        </div>
      )
      //if keyword is present then there will blue span around the keyword ^
    }


    let editContent;
    

    //gen array of changeable 'values' in state...
    if(this.state.editMode){
      editContent = this.state.editValues.map((editvalue,x)=>
        <div className='editObj' key={uniqid()} >
          <textarea id={'e'+x} key={uniqid()} type="text" value={editvalue} onChange={(e)=>this.handleChange(x,e)}/> 

        </div>

      )

    }




    let flashcardTopicMenu;
    //same as the subject rendering menu
    if(this.state.flashcardMode){
      flashcardTopicMenu = this.state.subjectData.topics.map((topic, x)=>
        <a className='flashCardTopicItem' key={uniqid()} onClick={()=>this.loadFlashcardDeck(x)}>
          <p style={{color:'white'}}>{topic.topicName}</p>
          <p style={{color:'red'}}>{topic.content.length} cards</p>
        </a>
      )
    }




    let flashcardDeck;
    //renders flaschards, giving each a zIndex accordign the state such that the zIndexes of each card can be dynamically cahnged
    //flashcards are rendered according to content object
    if(this.state.openDeck){
      flashcardDeck = this.state.flashcardDeck.map((card, x)=>
        <div key={uniqid()} 
        className='flashcard' 
        style={{display:this.state.doneCards[x] ,zIndex:this.state.flashcardZPos[x], position:'absolute',top:0, left:0}}
        onClick={()=>{this.setState({cardReveal:true})}}>
          {this.state.cardReveal?(
          <p>
            {card.after}
          </p>):
          
          (<p>
            {this.flashcardQuestion(card.keyword)}
            {card.before}?
          </p>)}
          
        </div>
      )
    }




    return(

      <div style={{display:'grid'}}>

        {this.state.subjectFocus==false?(

          <div className='subjectWrapper'  style={this.state.flashcardMode?{display:'none'}:{}}>

            <button 
            onClick={()=>this.setState({deleteSubjectMode:true})} 
            className="editSubjects"
            style={this.state.deleteSubjectMode?{display:'none'}:{display:'initial'}}
            >edit</button>

            <button
             onClick={()=>this.setState({deleteSubjectMode:false})} 
            className="editSubjects"
            style={!this.state.deleteSubjectMode?{display:'none'}:{display:'initial'}}
            >done</button>

                      
            {this.state.loadingData || !this.state.subjects ?(<div></div>):(

            <div className='subjectItemWrapper'>
              {renderSubjects}
              <a className="subjectItem addSubjectItem" onClick={()=>this.setState({addSubjectMode:true})}>

                {this.state.addSubjectMode?(
                <form onSubmit={this.updateSubjects}>
                  <input className="addSubjectInput" type="text" value={this.state.addSubject} onChange={this.addSubject}></input>
                  <button type="submit">Add</button>
                </form>):(<p>+</p>)}

              </a>
            </div>   

            )}
          </div>
        ):(

          <div className='subjectContentWrapper'>

            {this.state.editMode==false?(
            <div className='focusMenu' style={this.props.mode==0?{backgroundColor: 'royalblue'}:{backgroundColor: 'red'}}>
              <button className ='backButton' onClick={()=>this.setState({subjectFocus:false, activeTopic:0})}>Back</button>
              {focusMenu}
              <form onSubmit={this.updateSubtopics} class="addSubtopicForm">
                <textarea
                value={this.state.addSubtopic}
                onChange={(e)=>this.addSubtopic(e)}
                onFocus={()=>this.setState({addSubtopicMode:true})}
                >
                
                

                </textarea>
                <button 
                type="submit"
                style={((this.state.addSubtopicMode)&&(this.state.addSubtopic.length>0))?{background: 'white', pointerEvents:'initial',borderColor:'white',color:'blue'}:{bacgkround: 'grey', pointerEvents:'none',borderColor:'grey',color:'grey'}}>Add</button>
              </form>
            </div>

            ):(
            <div className='focusMenu' style={this.props.mode==0?{backgroundColor: 'royalblue'}:{backgroundColor: 'red'}}>
              <div></div>
              <a style={{pointerEvents:'none'}}>{this.state.subjectData.topics[this.state.activeTopic].topicName}</a>
            </div>
            )}



            {this.state.editMode==false?(<div className='content'>{content}</div>):
            
            (<form className='editContent' onSubmit={this.saveEdits}>
              
              {editContent}
              
              <div className='editObj'>
                <textarea
                style={this.state.newEdit?{}:{border:'1px solid grey', borderRadius:'25px'}} 
                onBlur={this.addEditObj} id={'addEditObj'} 
                type="text"
                 value={this.newEditValue} 
                 onChange={(e)=>this.changeEditValue(e)}/> 
              </div>

              <div className='editObj' style={this.state.newEditValue==false?{pointerEvents:'none'}:{}}>
                <textarea 
                style={this.state.newEdit?{border:'1px solid grey', borderRadius:'25px'}:{}} 
                onClick={this.addEditObj} id={this.state.editValues.length-1} type="text" 
                value={this.newEditValue} 
                onChange={(e)=>this.changeEditValue(e)}/> 
              </div>

              <div className='contentButton submitButton'>
                <button type="submit" style={{alignSelf:'center'}}>Save</button>
              </div>

            </form>)}
            

            {this.state.editMode==false?(
            <div className='contentButton'>
              <button onClick={()=>{this.setState({editMode:true})}} style={{alignSelf:'flex-end'}}>Edit</button>
              <button onClick={this.removeSubtopic}>Delete</button>
            </div>
            ):(<div style={{display:'none'}}></div>)}


          </div>

        )}

        {/* flashcard section.... */}

        {this.state.flashcardMode==true?(

          <div className='flashCardWrapper'>
                      
            {this.state.loadingData ?(<div></div>):(
              
              <div className='flashCardItemWrapper'>
                <div className="exitFlashcards">
                  <button style={this.state.openDeck?{display:'none'}:{}} onClick={()=>this.setState({flashcardMode:false,})}>Back</button>
                  <button style={this.state.openDeck==false?{display:'none'}:{}} 
                  onClick={()=>this.setState({
                      openDeck:false,
                      flashcardZPos: [],
                      doneCards: [],
                      doneCount:0
                    
                    })}>Done</button>
                </div>

                
                {this.state.openDeck==false?flashcardTopicMenu:(
                <div style={{position:'relative', gridColumn:'1/10'}}>

                  <div className="progressBar" style={this.progressBar()}>
                    <div className="bar" style={this.progressBarInner()}></div>
                  </div>

                  {flashcardDeck}
                  <div className="flashCardButtons" style={((this.state.doneCount==this.state.doneCards.length)||(!this.state.cardReveal))?{pointerEvents:'none'}:{}}>
                    <button style={((this.state.doneCount==this.state.doneCards.length)||(!this.state.cardReveal))?{color:'grey', borderColor:'grey'}:{}} onClick={()=>this.rotateFlashcard(false)}>Again</button>
                    <button style={((this.state.doneCount==this.state.doneCards.length)||(!this.state.cardReveal))?{color:'grey', borderColor:'grey'}:{}} onClick={()=>this.rotateFlashcard(true)}>Good</button>


                    

                  </div>

                  <div style={this.state.doneCount==this.state.doneCards.length?{display:'grid'}:{display:'none'}} className="completeDeck">
                    <h1>Congrats!</h1>
                    <p>You have completed this deck</p>
                  </div>


                </div>)}
                
                

              </div>  



            )}

          </div>):<div></div>}

          

      </div>
      

    )
  }
}

export default Menu;
