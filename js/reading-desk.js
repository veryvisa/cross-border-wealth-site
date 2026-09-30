(() => {
 const root=document.documentElement;
 const systemDark=()=>window.matchMedia('(prefers-color-scheme: dark)').matches;
 const isDark=()=>root.dataset.theme==='dark'||(!root.dataset.theme&&systemDark());
 try { const saved=localStorage.getItem('crossborder-appearance');if(['light','dark'].includes(saved))root.dataset.theme=saved; } catch {}
 const button=document.querySelector('[data-desk-theme]');
 const label=()=>{if(button){button.textContent=isDark()?'切换亮色':'切换暗色';button.setAttribute('aria-label',button.textContent);}};
 if(button){button.hidden=false;label();button.addEventListener('click',()=>{root.dataset.theme=isDark()?'light':'dark';try{localStorage.setItem('crossborder-appearance',root.dataset.theme);}catch{}label();});}
 window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',label);
 const narrow=window.matchMedia('(max-width: 700px)');
 for(const select of document.querySelectorAll('[data-table-picker]')){
  const table=document.getElementById(select.dataset.tablePicker);if(!table)continue;
  select.closest('label').hidden=false;
  const render=()=>{[...table.querySelectorAll('tbody tr')].forEach((row,i)=>{row.hidden=narrow.matches&&select.value!=='all'&&select.value!==String(i);});};
  select.addEventListener('change',render);narrow.addEventListener('change',render);
 }
 // Missing decorative scenes reveal the same CSS motif, without touching knowledge-card behaviour.
 document.querySelectorAll('.desk-scene img,.cover-bg').forEach(img=>{
  const fallback=()=>{img.hidden=true;const parent=img.closest('.desk-scene,.cover');parent?.classList.add(parent.classList.contains('cover')?'cover-motif':'desk-motif');};
  img.addEventListener('error',fallback);if(img.complete&&!img.naturalWidth)fallback();
 });
})();
