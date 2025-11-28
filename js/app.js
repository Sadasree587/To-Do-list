// To-Do app with drag-and-drop and persistence
const storageKey = 'tt_tasks_v1';
let tasks = JSON.parse(localStorage.getItem(storageKey) || '[]');

const listEl = document.getElementById('list');
const newInput = document.getElementById('newInput');
const filterSel = document.getElementById('filter');
const clearDoneBtn = document.getElementById('clearDone');
const leftCount = document.getElementById('leftCount');

function save(){
  localStorage.setItem(storageKey, JSON.stringify(tasks));
  render();
}

function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

function addTask(text){
  if(!text.trim()) return;
  tasks.unshift({id:uid(), text:text.trim(), done:false});
  save();
}

function removeTask(id){
  tasks = tasks.filter(t=>t.id !== id);
  save();
}

function toggleDone(id){
  tasks = tasks.map(t => t.id===id?{...t, done:!t.done}:t);
  save();
}

function updateText(id, newText){
  tasks = tasks.map(t => t.id===id?{...t, text:newText}:t);
  save();
}

function clearDone(){
  tasks = tasks.filter(t=>!t.done);
  save();
}

function render(){
  // filter
  const filter = filterSel.value;
  const visible = tasks.filter(t => {
    if(filter==='active') return !t.done;
    if(filter==='done') return t.done;
    return true;
  });

  listEl.innerHTML = '';
  visible.forEach((t, idx)=>{
    const li = document.createElement('li');
    li.draggable = true;
    li.dataset.id = t.id;
    if(t.done) li.classList.add('done');

    // checkbox
    const ch = document.createElement('div');
    ch.className = 'checkbox';
    ch.onclick = ()=> toggleDone(t.id);

    // title
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = t.text;
    title.ondblclick = ()=> startEdit(t.id, title);

    // delete
    const del = document.createElement('button');
    del.className = 'delete';
    del.textContent = '✖';
    del.onclick = ()=> removeTask(t.id);

    li.appendChild(ch);
    li.appendChild(title);
    li.appendChild(del);

    // drag handlers
    li.addEventListener('dragstart', dragStart);
    li.addEventListener('dragend', dragEnd);
    li.addEventListener('dragover', dragOver);
    li.addEventListener('drop', drop);

    listEl.appendChild(li);
  });

  leftCount.textContent = `${tasks.filter(t=>!t.done).length} items left`;
}

// edit flow
function startEdit(id, titleEl){
  const old = titleEl.textContent;
  const input = document.createElement('input');
  input.value = old;
  input.className = 'editInput';
  titleEl.replaceWith(input);
  input.focus();
  input.select();
  input.addEventListener('blur', ()=> finishEdit(id, input, old));
  input.addEventListener('keydown', e=>{
    if(e.key === 'Enter') input.blur();
    if(e.key === 'Escape') { input.value = old; input.blur(); }
  });
}
function finishEdit(id, input, old){
  const val = input.value.trim();
  if(val && val !== old) updateText(id, val);
  else render(); // restore
}

// drag-and-drop implementation (reorder tasks)
let dragSrcEl = null;
function dragStart(e){
  this.classList.add('dragging');
  dragSrcEl = this;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', this.dataset.id);
}
function dragEnd(){
  this.classList.remove('dragging');
}
function dragOver(e){
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const target = e.currentTarget;
  if(target === dragSrcEl) return;
  const bounding = target.getBoundingClientRect();
  const offset = e.clientY - bounding.top + (bounding.height/2);
}
function drop(e){
  e.preventDefault();
  const idFrom = e.dataTransfer.getData('text/plain');
  const idTo = this.dataset.id;
  if(!idFrom || !idTo || idFrom === idTo) return;

  // reorder in tasks: move idFrom to index of idTo
  const fromIndex = tasks.findIndex(t=>t.id===idFrom);
  const toIndex = tasks.findIndex(t=>t.id===idTo);
  if(fromIndex < 0 || toIndex < 0) return;
  const [moved] = tasks.splice(fromIndex, 1);
  tasks.splice(toIndex, 0, moved);
  save();
}

// UI events
newInput.addEventListener('keydown', e=>{
  if(e.key === 'Enter') { addTask(newInput.value); newInput.value=''; }
});
filterSel.addEventListener('change', render);
clearDoneBtn.addEventListener('click', clearDone);

// initial sample tasks if empty
if(tasks.length===0){
  tasks = [
    {id:uid(), text:'Create GitHub portfolio', done:false},
    {id:uid(), text:'Prepare project README', done:false},
    {id:uid(), text:'Practice interview questions', done:true}
  ];
  save();
} else {
  render();
}
