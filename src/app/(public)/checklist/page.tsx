
'use client';

import { useEffect } from 'react';

export default function ChecklistPage() {
  useEffect(() => {
    /* ---------- Configuration ---------- */
    const STORAGE_KEY = 'ucs_checklist_v2';
    const SIG_KEY = 'ucs_checklist_sigs_v2';
    const AUTOSAVE_DEBOUNCE = 600; // ms

    // set current date
    const dateNowEl = document.getElementById('dateNow');
    if (dateNowEl) {
      dateNowEl.textContent = new Date().toLocaleDateString('pt-BR');
    }
    

    // Theme management
    const THEME_KEY = 'ucs_theme';
    let currentTheme = localStorage.getItem(THEME_KEY) || 'light';

    function applyTheme(theme: string) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem(THEME_KEY, theme);
      currentTheme = theme;
      
      const themeBtn = document.getElementById('themeToggle');
      if (themeBtn) {
        themeBtn.textContent = theme === 'dark' ? '☀️ Claro' : '🌙 Escuro';
      }
    }

    // Initialize theme
    applyTheme(currentTheme);

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        });
    }

    const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"][data-key]')) as HTMLInputElement[];

    // Enhanced progress tracking with statistics
    function updateProgressUI(){
      const total = checkboxes.length;
      const done = checkboxes.filter(cb => cb.checked).length;
      const pct = total===0?0:Math.round((done/total)*100);
      
      // Update all progress indicators
      const progressPctEl = document.getElementById('progressPct');
      if(progressPctEl) progressPctEl.textContent = pct + '%';

      const progressBigEl = document.getElementById('progressBig');
      if(progressBigEl) progressBigEl.textContent = pct + '%';

      const progressTextEl = document.getElementById('progressText');
      if(progressTextEl) progressTextEl.textContent = pct + '%';
      
      const completedItemsEl = document.getElementById('completedItems');
      if(completedItemsEl) completedItemsEl.textContent = String(done);

      const totalItemsEl = document.getElementById('totalItems');
      if(totalItemsEl) totalItemsEl.textContent = String(total);
      
      // Update progress bars
      const progressFill = document.getElementById('progressFill') as HTMLElement;
      const progressFillSidebar = document.getElementById('progressFillSidebar') as HTMLElement;
      if (progressFill) progressFill.style.width = pct + '%';
      if (progressFillSidebar) progressFillSidebar.style.width = pct + '%';
      
      // Update last update time
      const lastUpdateEl = document.getElementById('lastUpdate');
      if(lastUpdateEl) lastUpdateEl.textContent = new Date().toLocaleTimeString('pt-BR');
      
      // Add completion celebration
      if (pct === 100) {
        document.body.classList.add('completed');
        setTimeout(() => {
          document.body.classList.remove('completed');
        }, 3000);
      }
    }

    // collapse behavior
    document.querySelectorAll('.collapsible').forEach(el=>{
      el.addEventListener('click', ()=>{
        const target = document.getElementById((el as HTMLElement).dataset.target || '');
        const chev = el.querySelector('.chev') as HTMLElement;
        if(!target) return;
        if(target.style.maxHeight && target.style.maxHeight !== '0px'){
          target.style.maxHeight = '0';
          if(chev) chev.style.transform = 'rotate(0deg)';
        } else {
          target.style.maxHeight = target.scrollHeight + 'px';
          if(chev) chev.style.transform = 'rotate(90deg)';
        }
      });
    });

    // open all sections by default
    document.querySelectorAll('.coll-content').forEach(c=>{
        const element = c as HTMLElement;
        element.style.maxHeight = element.scrollHeight + 'px';
    });


    // debounce util
    function debounce(fn: Function, delay: number){ let t: any; return (...args: any[])=>{ clearTimeout(t); t = setTimeout(()=>fn(...args), delay); } }

    // save state with enhanced tracking
    function saveState(){
      const state: {[key: string]: boolean} = {};
      
      checkboxes.forEach(cb => state[cb.dataset.key as string] = cb.checked);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      
      const sigs = {
        devName: (document.getElementById('sigDevName') as HTMLInputElement)?.value || '',
        devDate: (document.getElementById('sigDevDate') as HTMLInputElement)?.value || '',
        clientName: (document.getElementById('sigClientName') as HTMLInputElement)?.value || '',
        clientDate: (document.getElementById('sigClientDate') as HTMLInputElement)?.value || ''
      };
      localStorage.setItem(SIG_KEY, JSON.stringify(sigs));
      
      updateProgressUI();
    }
    const saveStateDebounced = debounce(saveState, AUTOSAVE_DEBOUNCE);

    // load state
    function loadState(){
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw){
        try{
          const state = JSON.parse(raw);
          checkboxes.forEach(cb => cb.checked = !!state[cb.dataset.key as string]);
        } catch(e){ console.warn('Invalid saved state', e) }
      }
      const rawS = localStorage.getItem(SIG_KEY);
      if(rawS){
        try{
          const sigs = JSON.parse(rawS);
          (document.getElementById('sigDevName') as HTMLInputElement).value = sigs.devName || '';
          (document.getElementById('sigDevDate') as HTMLInputElement).value = sigs.devDate || '';
          (document.getElementById('sigClientName') as HTMLInputElement).value = sigs.clientName || '';
          (document.getElementById('sigClientDate') as HTMLInputElement).value = sigs.clientDate || '';
        } catch(e){}
      }
      updateProgressUI();
    }

    // clear state
    function clearState(){
      if(confirm('Deseja realmente limpar o progresso salvo? Esta ação apagará o estado no navegador.')){
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(SIG_KEY);
        checkboxes.forEach(cb => cb.checked = false);
        (document.getElementById('sigDevName') as HTMLInputElement).value = '';
        (document.getElementById('sigDevDate') as HTMLInputElement).value = '';
        (document.getElementById('sigClientName') as HTMLInputElement).value = '';
        (document.getElementById('sigClientDate') as HTMLInputElement).value = '';
        updateProgressUI();
        alert('Progresso limpo.');
      }
    }

    // attach checkbox events
    checkboxes.forEach(cb=>{
      cb.addEventListener('change', ()=> saveStateDebounced() );
    });

    // attach signature input events
    ['sigDevName','sigDevDate','sigClientName','sigClientDate'].forEach(id=>{
      const el = document.getElementById(id);
      if(el) el.addEventListener('input', saveStateDebounced);
    });

    // initial load
    loadState();

    // buttons
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', ()=>{
            saveState();
            alert('Progresso salvo localmente.');
        });
    }

    const loadBtn = document.getElementById('loadBtn');
    if(loadBtn) loadBtn.addEventListener('click', ()=>{ loadState(); alert('Progresso restaurado.'); });

    const clearBtn = document.getElementById('clearBtn');
    if(clearBtn) clearBtn.addEventListener('click', clearState);

    const resetBtn = document.getElementById('resetBtn');
    if(resetBtn) resetBtn.addEventListener('click', ()=>{
      if(confirm('Resetar todos os itens visíveis (não apaga o salvo salvo no storage automaticamente). Continuar?')){
        checkboxes.forEach(cb => cb.checked = false);
        saveState();
      }
    });

    const selectAllBtn = document.getElementById('selectAllBtn');
    if(selectAllBtn) selectAllBtn.addEventListener('click', ()=>{ checkboxes.forEach(cb => cb.checked = true); saveState(); alert('Todos os itens foram marcados!'); });

    const unselectAllBtn = document.getElementById('unselectAllBtn');
    if(unselectAllBtn) unselectAllBtn.addEventListener('click', ()=>{ checkboxes.forEach(cb => cb.checked = false); saveState(); alert('Todos os itens foram desmarcados!'); });
    
    const resetAllBtn = document.getElementById('resetAllBtn');
    if(resetAllBtn) resetAllBtn.addEventListener('click', ()=>{
      if(confirm('⚠️ ATENÇÃO: Isso irá apagar TODOS os dados salvos (progresso, assinaturas, etc). Esta ação não pode ser desfeita. Continuar?')){
        localStorage.clear();
        checkboxes.forEach(cb => cb.checked = false);
        (document.getElementById('sigDevName') as HTMLInputElement).value = '';
        (document.getElementById('sigDevDate') as HTMLInputElement).value = '';
        (document.getElementById('sigClientName') as HTMLInputElement).value = '';
        (document.getElementById('sigClientDate') as HTMLInputElement).value = '';
        applyTheme('light');
        updateProgressUI();
        alert('Reset completo realizado!');
      }
    });

    const exportPdf = document.getElementById('exportPdf');
    if(exportPdf) {
        exportPdf.addEventListener('click', async ()=> {
          // @ts-ignore
          if (typeof html2pdf === 'undefined') {
            alert('Biblioteca html2pdf não está carregada. Recarregue a página e tente novamente.');
            return;
          }
          document.querySelectorAll('.coll-content').forEach(c=>{
            const element = c as HTMLElement;
            element.style.maxHeight = element.scrollHeight + 'px';
          });
        
          await new Promise(resolve => setTimeout(resolve, 500));
        
          const btn = document.getElementById('exportPdf') as HTMLButtonElement;
          const prevText = btn.textContent;
          btn.textContent = 'Gerando PDF...';
          btn.disabled = true;
        
          saveState();
        
          const dev = ((document.getElementById('sigDevName') as HTMLInputElement).value || 'dev').replace(/\s+/g,'_');
          const client = ((document.getElementById('sigClientName') as HTMLInputElement).value || 'client').replace(/\s+/g,'_');
          const date = new Date().toISOString().slice(0,10);
          const filename = `UCS_Documentacao_Checklist_${dev}_${client}_${date}.pdf`;
        
          const element = document.getElementById('docArea');
        
          const opt = {
            margin:       [15, 15, 15, 15],
            filename:     filename,
            image:        { type: 'jpeg', quality: 0.92 },
            html2canvas:  { scale: 2, useCORS: true, logging: true, scrollY: 0, scrollX: 0 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };
        
          // @ts-ignore
          html2pdf().set(opt).from(element).save().then(() => {
            btn.textContent = '✅ PDF Gerado!';
            setTimeout(() => {
              btn.textContent = prevText;
              btn.disabled = false;
            }, 2000);
          }).catch((err: any) => {
            console.error('Erro na geração do PDF:', err);
            alert('Erro ao gerar PDF: ' + (err && err.message ? err.message : err));
            btn.textContent = prevText;
            btn.disabled = false;
          });
        });
    }

    const beforeUnloadHandler = () => saveState();
    window.addEventListener('beforeunload', beforeUnloadHandler);

    return () => {
        // Cleanup event listeners
        document.querySelectorAll('.collapsible').forEach(el => el.removeEventListener('click', () => {}));
        checkboxes.forEach(cb => cb.removeEventListener('change', () => {}));
        ['sigDevName','sigDevDate','sigClientName','sigClientDate'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.removeEventListener('input', saveStateDebounced);
        });
        if(themeToggle) themeToggle.removeEventListener('click', () => {});
        if(saveBtn) saveBtn.removeEventListener('click', () => {});
        if(loadBtn) loadBtn.removeEventListener('click', () => {});
        if(clearBtn) clearBtn.removeEventListener('click', () => {});
        if(resetBtn) resetBtn.removeEventListener('click', () => {});
        if(selectAllBtn) selectAllBtn.removeEventListener('click', () => {});
        if(unselectAllBtn) unselectAllBtn.removeEventListener('click', () => {});
        if(resetAllBtn) resetAllBtn.removeEventListener('click', () => {});
        if(exportPdf) exportPdf.removeEventListener('click', () => {});
        window.removeEventListener('beforeunload', beforeUnloadHandler);
    };

  }, []);

  return (
    <>
      <div className="container">
        <main>
          <header>
            <div className="brand" title="UCS Index Platform">
              UCS
              <small style={{display: 'block', fontWeight: 600}}>Index</small>
            </div>

            <div style={{flex:1}}>
              <h1>UCS Index Platform — Checklist de Entrega</h1>
              <div className="subtitle">Documento técnico completo, checklist interativo e diagramas — progresso salvo localmente</div>
            </div>

            <div className="toolbar">
              <button id="themeToggle" className="ghost small" title="Alternar tema">🌙 Tema</button>
              <button id="exportPdf" className="btn small" title="Exportar para PDF">📤 PDF</button>
              <button id="saveBtn" className="btn small" style={{background:'var(--gradient-success)'}} title="Salvar agora">💾 Salvar</button>
              <button id="resetBtn" className="ghost small" title="Limpar tela">♻️ Reset</button>
              <div className="progress-indicator">
                <div className="progress-bar">
                  <div className="progress-fill" id="progressFill"></div>
                </div>
                <span className="progress-text" id="progressText">0%</span>
              </div>
            </div>
          </header>

          <div id="docArea">
            <section className="card" aria-labelledby="summary-title">
              <div className="section-head">
                <div className="section-title">
                  <div className="icon">📋</div>
                  <div>
                    <h2 id="summary-title">Resumo da Entrega</h2>
                    <div className="muted">Versão: 1.0.0 • Data de Entrega: <span id="dateNow"></span></div>
                  </div>
                </div>
                <div className="tag">Entrega Técnica</div>
              </div>
              <p className="muted-note">Este documento reúne a documentação técnica, checklists de pré-entrega, entrega, testes, segurança e suporte, além dos diagramas arquiteturais necessários para transferência e onboarding.</p>
            </section>
            
            <section className="card">
                <div className="section-head">
                    <div className="section-title">
                    <div className="icon">🏛️</div>
                    <div>
                        <h2>Visão Geral do Projeto</h2>
                        <div className="muted">Descrição, funcionalidades e tecnologias</div>
                    </div>
                    </div>
                </div>

                <div style={{marginTop:'10px'}}>
                    <h3>Descrição</h3>
                    <p className="muted-note">UCS Index Platform é uma aplicação web para monitoramento de índices de sustentabilidade, commodities e ativos, com análises, relatórios em PDF/Excel e integração com automações (N8N) e IA (Google Genkit).</p>

                    <h3 style={{marginTop:'10px'}}>Principais funcionalidades</h3>
                    <ul>
                    <li>Dashboard executivo em tempo real</li>
                    <li>Análise de composição e tendências</li>
                    <li>Relatórios automatizados (PDF / Excel)</li>
                    <li>Administração, auditoria e recálculos</li>
                    <li>Integração com Google AI e N8N</li>
                    </ul>
                </div>
            </section>

            <section className="card">
                <div className="section-head">
                    <div className="section-title">
                    <div className="icon">📁</div>
                    <div>
                        <h2>Estrutura de Pastas & Módulos</h2>
                        <div className="muted">Resumo da organização do repositório</div>
                    </div>
                    </div>
                </div>
                <pre className="muted-note" style={{background:'#fbfdff',padding:'12px',borderRadius:'8px',marginTop:'12px',overflow:'auto'}}>
    {`UCS/
    ├── src/
    │   ├── app/ (Next.js App Router)
    │   ├── components/
    │   ├── lib/ (ai/, firebase/, data-service)
    │   └── hooks/
    ├── docs/
    ├── public/
    ├── package.json
    └── next.config.ts`}
                </pre>
            </section>
            
            <section className="card">
                <div className="section-head">
                    <div className="section-title">
                        <div className="icon">✅</div>
                        <div>
                            <h2>Checklist de Entrega</h2>
                            <div className="muted">Itens agrupados — marque e salve automaticamente</div>
                        </div>
                    </div>
                    <div style={{fontSize: '13px', color: 'var(--muted)'}}>Progresso: <strong id="progressPct">0%</strong></div>
                </div>
                <div style={{marginTop:'12px'}}>
                    <div className="collapsible" data-target="preEntrega">
                        <div className="title"><strong>📋 Pré-Entrega</strong></div>
                        <div className="chev">▸</div>
                    </div>
                    <div id="preEntrega" className="coll-content" style={{padding:'12px 0'}}>
                        <h3>🏗️ Desenvolvimento Concluído</h3>
                        <ul className="checklist-list">
                            <li className="check-item"><label><input type="checkbox" data-key="pre_dev_func"/><span className="txt">Todas as funcionalidades implementadas</span></label></li>
                            <li className="check-item"><label><input type="checkbox" data-key="pre_dev_tests"/><span className="txt">Testes locais realizados com sucesso</span></label></li>
                        </ul>
                    </div>
                    <div className="collapsible" data-target="entrega">
                        <div className="title"><strong>🚀 Entrega</strong></div>
                        <div className="chev">▸</div>
                    </div>
                    <div id="entrega" className="coll-content" style={{padding:'12px 0'}}>
                        <h3>📦 Arquivos Entregues</h3>
                        <ul className="checklist-list">
                            <li className="check-item"><label><input type="checkbox" data-key="entrega_code"/><span className="txt">Código-fonte completo</span></label></li>
                            <li className="check-item"><label><input type="checkbox" data-key="entrega_doc"/><span className="txt">Documentação técnica</span></label></li>
                        </ul>
                    </div>
                    <div style={{marginTop: '14px'}}>
                        <h3>✅ Assinaturas</h3>
                        <div style={{display:'flex',gap:'12px',marginTop:'8px',flexWrap:'wrap'}}>
                            <div style={{flex:1,minWidth:'220px'}}>
                            <div style={{fontSize:'13px',color:'var(--muted)'}}>Desenvolvedor</div>
                            <input id="sigDevName" className="sig-input" placeholder="Nome do desenvolvedor" />
                            </div>
                            <div style={{minWidth:'200px'}}>
                            <div style={{fontSize:'13px',color:'var(--muted)'}}>Data</div>
                            <input id="sigDevDate" className="sig-input" placeholder="DD/MM/AAAA" />
                            </div>
                        </div>
                        <div style={{display:'flex',gap:'12px',marginTop:'12px',flexWrap:'wrap'}}>
                            <div style={{flex:1,minWidth:'220px'}}>
                            <div style={{fontSize:'13px',color:'var(--muted)'}}>Cliente</div>
                            <input id="sigClientName" className="sig-input" placeholder="Nome do cliente" />
                            </div>
                            <div style={{minWidth:'200px'}}>
                            <div style={{fontSize:'13px',color:'var(--muted)'}}>Data</div>
                            <input id="sigClientDate" className="sig-input" placeholder="DD/MM/AAAA" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
          </div>
          <footer>
            <div className="muted">Arquivo local — progresso salvo no navegador (localStorage). Use "Exportar PDF" para gerar o documento final.</div>
          </footer>
        </main>
        <aside>
          <div className="sticky">
            <div className="card">
              <div className="panel-title">📊 Progresso</div>
              <div style={{textAlign:'center',margin:'16px 0'}}>
                <div style={{fontSize:'48px',fontWeight:800,background:'var(--gradient-primary)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}} id="progressBig">0%</div>
                <div style={{fontSize:'14px',color:'var(--muted)',marginTop:'8px'}}>
                  <span id="completedItems">0</span> de <span id="totalItems">0</span> itens concluídos
                </div>
                <div style={{marginTop:'12px'}}>
                  <div className="progress-bar" style={{width:'100%',height:'8px'}}>
                    <div className="progress-fill" id="progressFillSidebar" style={{width:'0%'}}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="panel-title">⚡ Ações Rápidas</div>
              <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                <button id="loadBtn" className="ghost small">🔁 Restaurar</button>
                <button id="clearBtn" className="ghost small">🧹 Limpar</button>
                <button id="selectAllBtn" className="ghost small">✅ Marcar Todos</button>
                <button id="unselectAllBtn" className="ghost small">❌ Desmarcar Todos</button>
              </div>
            </div>
            <div className="card">
                <div className="panel-title">💡 Dicas</div>
                <ul style={{paddingLeft:'16px',color:'var(--muted)',fontSize:'13px',lineHeight:1.6}}>
                    <li>Clique nos cabeçalhos para expandir/recolher</li>
                    <li>Progresso salvo automaticamente</li>
                    <li>Alterne entre temas claro/escuro</li>
                </ul>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
