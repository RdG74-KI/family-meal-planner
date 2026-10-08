(()=>{
const el=document.createElement('div');el.id='videoRecipeModal';el.style.cssText='display:none;position:fixed;inset:0;z-index:999999;background:#000d;overflow:auto;padding:20px';
el.innerHTML='<div style="max-width:670px;margin:25px auto;padding:22px;border:1px solid #883849;border-radius:18px;background:#151a20;color:white"><button id="vrClose" style="float:right">✕</button><h2>🎬 Video-Rezept importieren</h2><p>Link von TikTok, Instagram oder Facebook teilen bzw. einfügen. Für die Rezepterkennung bitte auch den Beschreibungstext oder das Transkript einfügen. Ein Link allein liefert noch keine Tonspur. Die automatische KI-Videoanalyse ist vorbereitet, aber bis zur ausdrücklichen Freigabe der externen API-Kosten deaktiviert (Budgetziel: CHF 5.–/Monat).</p><label>Videolink<input id="vrLink" placeholder="https://..." style="width:100%"></label><label style="display:block;margin-top:10px">Rezepttext / Untertitel / Transkript<textarea id="vrText" rows="7" style="width:100%" placeholder="Rezeptname\nZutaten:\n200 g Quark\n2 Eier\nZubereitung:\nAlles vermischen und backen."></textarea></label><button id="vrParse">✨ Rezepttext aufbereiten</button><div id="vrDraft" style="display:none"><hr><label>Rezeptname<input id="vrName" style="width:100%"></label><label>Portionen<input id="vrPortions" type="number" min="1" max="20" value="4" style="width:100%"></label><label>Zutaten je Zeile<textarea id="vrIngredients" rows="5" style="width:100%"></textarea></label><label>Zubereitung je Zeile<textarea id="vrSteps" rows="5" style="width:100%"></textarea></label><label>📷 Rezeptbild auswählen (Foto oder Screenshot vom fertigen Gericht)<input id="vrPhoto" type="file" accept="image/*" style="width:100%"></label><img id="vrPreview" alt="Rezeptbild-Vorschau" style="display:none;max-width:100%;max-height:230px;object-fit:cover;border-radius:12px;margin:10px 0"><p>Fehlende Mengen bitte selbst ergänzen; Nährwerte und Preise werden nicht erfunden.</p><button id="vrSave">💾 In Family Fit speichern</button></div><p id="vrMessage" role="status" style="color:#eac66d"></p></div>';
document.body.append(el);el.querySelectorAll('label').forEach(x=>x.style.display='block');
const g=id=>document.getElementById(id), msg=s=>g('vrMessage').textContent=s;
const open=()=>{el.style.display='block';document.body.style.overflow='hidden'};
const close=()=>{el.style.display='none';document.body.style.overflow=''};
window.openFamilyFitRecipeImport=(data='')=>{if(data){let match=String(data).match(/https?:\/\/[^\s]+/);if(match)g('vrLink').value=match[0];let other=String(data).replace(match?.[0]||'','').trim();if(other)g('vrText').value=other;}open()};
let photoData='';
g('vrPhoto').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f){photoData='';return}if(!f.type.startsWith('image/')){msg('Bitte eine Bilddatei wählen.');return}try{const img=new Image(),blobUrl=URL.createObjectURL(f);await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=blobUrl});const canvas=document.createElement('canvas'),factor=Math.min(1,800/Math.max(img.width,img.height));canvas.width=Math.round(img.width*factor);canvas.height=Math.round(img.height*factor);canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);photoData=canvas.toDataURL('image/jpeg',.68);URL.revokeObjectURL(blobUrl);g('vrPreview').src=photoData;g('vrPreview').style.display='block';msg('✓ Rezeptfoto vorbereitet.')}catch{msg('Bild konnte nicht verarbeitet werden.')}});
g('vrClose').onclick=close;
el.onclick=e=>{if(e.target===el)close()};
function social(u){try{let h=new URL(u).hostname.toLowerCase();return ['tiktok.com','instagram.com','facebook.com','fb.watch','youtube.com','youtu.be'].some(d=>h===d||h.endsWith('.'+d))&&/^https?:/.test(new URL(u).protocol)}catch{return false}}
g('vrParse').onclick=()=>{
let url=g('vrLink').value.trim(),txt=g('vrText').value.trim();
if(url&&!social(url)){msg('Bitte gültigen Social-Media-Videolink verwenden.');return}
if(!txt){msg('Bitte Beschreibung oder Transkript einfügen. Automatische Tonerkennung benötigt noch einen geschützten KI-Dienst.');return}
let title='',mode='',ingredients=[],steps=[];
for(const original of txt.replace(/\r/g,'').split('\n').map(x=>x.trim()).filter(Boolean)){
const line=original.replace(/^[•* -]\s*/,'');
if(/^(zutaten|ingredients|ingredienti)\s*:?\s*$/i.test(line)){mode='i';continue}
if(/^(zubereitung|anleitung|instructions|preparation|preparazione|schritte)\s*:?\s*$/i.test(line)){mode='s';continue}
if(!title&&!mode&&!/^(#|@|https?:)/.test(line)){title=line;continue}
if(/^(#|@|https?:)/.test(line))continue;
if(mode==='i')ingredients.push(line);
else if(mode==='s')steps.push(line.replace(/^\d+[.)]\s*/,''));
else if(/^\d+\s*(g|kg|ml|l|el|tl|stück|eier|cups?|tbsp|tsp)\b/i.test(line))ingredients.push(line);
}
g('vrName').value=title||'Rezept aus Social Media';
g('vrIngredients').value=ingredients.join('\n');g('vrSteps').value=steps.join('\n');g('vrDraft').style.display='block';
msg(ingredients.length&&steps.length?'Rezeptentwurf erkannt – bitte prüfen.':'Rezepttext übernommen. Fehlende Zutaten und Schritte ergänzen.');
};
g('vrSave').onclick=()=>{
let name=g('vrName').value.trim(),ings=g('vrIngredients').value.trim(),steps=g('vrSteps').value.trim(),url=g('vrLink').value.trim();
if(!name||!ings||!steps){msg('Name, Zutaten und Zubereitung müssen ausgefüllt sein.');return}
if(url&&!social(url)){msg('Bitte gültigen Videolink eingeben.');return}
if(typeof customRecipes==='undefined'||typeof addRecipe!=='function'){msg('Rezeptverwaltung ist nicht bereit.');return}
if(url&&customRecipes.some(x=>x.sourceUrl===url)&&!confirm('Video bereits gespeichert. Trotzdem nochmals importieren?'))return;
const previous=customRecipes.length;
g('rName').value=name;g('rServ').value=String(Math.min(20,Math.max(1,Number(g('vrPortions').value)||4)));g('rPrice').value='';g('rProtein').value='';g('rItems').value=ings;g('rSteps').value=steps;
try{addRecipe();if(customRecipes.length<=previous)throw Error('Rezept konnte nicht gespeichert werden.');
const x=customRecipes[customRecipes.length-1];x.sourceUrl=url;x.sourceType='social-recipe';if(photoData)x.image=photoData;x.importedAt=new Date().toISOString();localStorage.setItem('customRecipes',JSON.stringify(customRecipes));
if(typeof renderOwn==='function')renderOwn();if(typeof renderRecipeLibrary==='function')renderRecipeLibrary();
close();if(typeof flash==='function')flash('✓ Rezept mit Zutaten und Zubereitung gespeichert');}
catch(e){msg('Speichern fehlgeschlagen: '+e.message)}
};
const button=document.createElement('button');button.textContent='🎬 Video-Rezept importieren';button.type='button';button.style.cssText='background:#c72848;color:white';button.id='vrImportOpen';button.onclick=open;
(document.querySelector('.actions')||document.querySelector('main')||document.body).prepend(button);
const p=new URLSearchParams(location.search),share=[p.get('title'),p.get('text'),p.get('url')].filter(Boolean).join('\n');
if(share){const match=share.match(/https?:\/\/[^\s]+/);if(match&&social(match[0])){g('vrLink').value=match[0];g('vrText').value=share.replace(match[0],'').trim();open();history.replaceState({},'',location.pathname+location.hash)}}
})();