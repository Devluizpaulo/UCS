
'use client';

import { useEffect } from 'react';
import Head from 'next/head';
import { Button } from '@/components/ui/button';

export default function AdminChecklistPage() {
  useEffect(() => {
    // A lógica interativa do checklist é executada aqui no cliente.
    const STORAGE_KEY = 'ucs_checklist_v2';
    const SIG_KEY = 'ucs_checklist_sigs_v2';
    const AUTOSAVE_DEBOUNCE = 600;

    const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"][data-key]')) as HTMLInputElement[];

    function updateProgressUI() {
      const total = checkboxes.length;
      const done = checkboxes.filter(cb => cb.checked).length;
      const pct = total === 0 ? 0 : Math.round((done / total) * 100);
      
      const progressTextEl = document.getElementById('progressText');
      if (progressTextEl) progressTextEl.textContent = `${pct}%`;
      
      const progressFill = document.getElementById('progressFill') as HTMLElement | null;
      if (progressFill) progressFill.style.width = `${pct}%`;

      const progressBigEl = document.getElementById('progressBig');
      if (progressBigEl) progressBigEl.textContent = `${pct}%`;

      const completedItemsEl = document.getElementById('completedItems');
      if(completedItemsEl) completedItemsEl.textContent = String(done);

      const totalItemsEl = document.getElementById('totalItems');
      if(totalItemsEl) totalItemsEl.textContent = String(total);
    }

    function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
      let timeoutId: ReturnType<typeof setTimeout>;
      return function(this: any, ...args: Parameters<T>) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
      };
    }

    function saveState() {
      const state: { [key: string]: boolean } = {};
      checkboxes.forEach(cb => {
        if (cb.dataset.key) {
          state[cb.dataset.key] = cb.checked;
        }
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      
      const sigs = {
        devName: (document.getElementById('sigDevName') as HTMLInputElement)?.value || '',
        devDate: (document.getElementById('sigDevDate') as HTMLInputElement)?.value || '',
        clientName: (document.getElementById('sigClientName') as HTMLInputElement)?.value || '',
        clientDate: (document.getElementById('sigClientDate') as HTMLInputElement)?.value || '',
      };
      localStorage.setItem(SIG_KEY, JSON.stringify(sigs));
      
      updateProgressUI();
    }

    const saveStateDebounced = debounce(saveState, AUTOSAVE_DEBOUNCE);

    function loadState() {
      const rawState = localStorage.getItem(STORAGE_KEY);
      if (rawState) {
        try {
          const state = JSON.parse(rawState);
          checkboxes.forEach(cb => {
            if (cb.dataset.key && state[cb.dataset.key]) {
              cb.checked = true;
            }
          });
        } catch (e) {
          console.warn('Could not parse checklist state', e);
        }
      }

      const rawSigs = localStorage.getItem(SIG_KEY);
      if (rawSigs) {
        try {
          const sigs = JSON.parse(rawSigs);
          (document.getElementById('sigDevName') as HTMLInputElement).value = sigs.devName || '';
          (document.getElementById('sigDevDate') as HTMLInputElement).value = sigs.devDate || '';
          (document.getElementById('sigClientName') as HTMLInputElement).value = sigs.clientName || '';
          (document.getElementById('sigClientDate') as HTMLInputElement).value = sigs.clientDate || '';
        } catch (e) {
          console.warn('Could not parse signatures state', e);
        }
      }
      updateProgressUI();
    }
    
     document.querySelectorAll('.collapsible').forEach(el=>{
      el.addEventListener('click', ()=>{
        const target = document.getElementById(el.getAttribute('data-target') || '');
        const chev = el.querySelector('.chev');
        if(!target) return;
        if(target.style.maxHeight && target.style.maxHeight !== '0px'){
          target.style.maxHeight = '0';
          if(target.style.paddingTop) target.style.paddingTop = '0';
          if(chev) (chev as HTMLElement).style.transform = 'rotate(0deg)';
        } else {
          target.style.maxHeight = target.scrollHeight + 'px';
          target.style.paddingTop = '12px';
          if(chev) (chev as HTMLElement).style.transform = 'rotate(90deg)';
        }
      });
    });


    const exportPdfButton = document.getElementById('exportPdf');
    if (exportPdfButton) {
      exportPdfButton.addEventListener('click', async () => {
        // @ts-ignore
        if (typeof html2pdf === 'undefined') {
          alert('Biblioteca html2pdf não está carregada. Recarregue a página e tente novamente.');
          return;
        }

        // Expand all sections to ensure they are rendered in the PDF
        document.querySelectorAll('.coll-content').forEach(content => {
          const el = content as HTMLElement;
          el.style.maxHeight = el.scrollHeight + "px";
          const trigger = el.previousElementSibling;
          if(trigger) {
            const chev = trigger.querySelector('.chev');
            if(chev) (chev as HTMLElement).style.transform = 'rotate(90deg)';
          }
        });

        const btn = exportPdfButton as HTMLButtonElement;
        const prevText = btn.textContent;
        btn.textContent = 'Gerando PDF...';
        btn.disabled = true;

        await new Promise(resolve => setTimeout(resolve, 500)); // wait for animations

        saveState();

        const dev = ((document.getElementById('sigDevName') as HTMLInputElement)?.value || 'dev').replace(/\s+/g,'_');
        const client = ((document.getElementById('sigClientName') as HTMLInputElement)?.value || 'client').replace(/\s+/g,'_');
        const date = new Date().toISOString().slice(0,10);
        const filename = `UCS_Documentacao_Checklist_${dev}_${client}_${date}.pdf`;

        const element = document.getElementById('docArea');
        if (!element) {
          alert('Erro: área de documento não encontrada.');
          return;
        }
        
        const opt = {
          margin: 15,
          filename: filename,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, logging: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
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
          alert('Erro ao gerar PDF: ' + (err.message || err));
          btn.disabled = false;
        });
      });
    }

    loadState();
    
     // Auto-expand all on initial load
    setTimeout(() => {
        document.querySelectorAll('.coll-content').forEach(content => {
            const el = content as HTMLElement;
            el.style.maxHeight = el.scrollHeight + "px";
            const trigger = el.previousElementSibling;
            if(trigger) {
                const chev = trigger.querySelector('.chev');
                if(chev) (chev as HTMLElement).style.transform = 'rotate(90deg)';
            }
        });
    }, 200);

    checkboxes.forEach(cb => {
      cb.addEventListener('change', saveStateDebounced);
    });
    
    ['sigDevName', 'sigDevDate', 'sigClientName', 'sigClientDate'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', saveStateDebounced);
    });

    return () => {
      checkboxes.forEach(cb => cb.removeEventListener('change', saveStateDebounced));
    };
  }, []);

  return (
    <>
      <Head>
        <script src="https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js" defer></script>
      </Head>
       <style jsx global>{`
        .checklist-container { padding: 1rem; max-width: 1200px; margin: auto; display: grid; grid-template-columns: 1fr 320px; gap: 1.5rem; align-items: start; }
        main { grid-column: 1 / 2; }
        aside { grid-column: 2 / 3; position: sticky; top: 1.5rem; }
        .checklist-card { background-color: var(--card); border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); border: 1px solid hsl(var(--border)); }
        .checklist-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .checklist-title-section { display: flex; align-items: center; gap: 1rem; }
        .checklist-icon { width: 2.75rem; height: 2.75rem; border-radius: 0.5rem; background-color: hsl(var(--muted)); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
        .checklist-title { font-size: 1.25rem; font-weight: 600; color: hsl(var(--foreground)); }
        .checklist-subtitle { font-size: 0.875rem; color: hsl(var(--muted-foreground)); }
        .checklist-tag { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; background-color: hsl(var(--secondary)); color: hsl(var(--secondary-foreground)); font-weight: 600; font-size: 0.75rem; }
        .checklist-list { margin-top: 1rem; list-style: none; padding: 0; }
        .checklist-item { display: flex; align-items: start; gap: 0.75rem; padding: 0.75rem 0.5rem; border-radius: 0.5rem; transition: background-color 0.2s; }
        .checklist-item:hover { background-color: hsl(var(--muted)/0.5); }
        .checklist-item label { display: flex; align-items: start; gap: 0.75rem; cursor: pointer; flex-grow: 1; }
        .checklist-item input[type="checkbox"] { margin-top: 3px; flex-shrink: 0; width: 1.125rem; height: 1.125rem; border-radius: 0.25rem; border: 1px solid hsl(var(--border)); accent-color: hsl(var(--primary)); }
        .checklist-item .txt { font-size: 0.875rem; color: hsl(var(--foreground)); }
        h3 { font-size: 1.125rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem; color: hsl(var(--primary)); }
        .sig-input { width: 100%; padding: 0.5rem; border-radius: 0.5rem; border: 1px solid hsl(var(--border)); margin-top: 0.25rem; background-color: hsl(var(--background)); }
        .collapsible { cursor: pointer; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid hsl(var(--border)); display: flex; align-items: center; justify-content: space-between; transition: background-color 0.2s; margin-top: 0.5rem; }
        .collapsible:hover { background-color: hsl(var(--muted)/0.5); }
        .collapsible .title { font-weight: 600; }
        .coll-content { overflow: hidden; transition: max-height 0.3s ease-out, padding 0.3s ease-out; max-height: 0; }
        .chev { transition: transform 0.2s; }
        .progress-bar-container { background-color: hsl(var(--muted)); border-radius: 9999px; overflow: hidden; height: 0.5rem; }
        .progress-bar-fill { background-color: hsl(var(--primary)); height: 100%; transition: width 0.3s; }
        .panel-title { font-weight: 600; margin-bottom: 0.75rem; }
        .diagram{width:100%;height:auto;border-radius:10px;border:1px solid hsl(var(--border));background:linear-gradient(180deg, hsl(var(--card)), hsl(var(--muted)));padding:12px;margin-top:12px; cursor: zoom-in; transition: transform 0.3s ease;}
        .diagram.zoomed { transform: scale(1.5); cursor: zoom-out; z-index: 10; position: relative; }
        .muted-note{font-size:13px;color:var(--muted);margin-top:6px}
        @media (max-width: 980px) { .checklist-container { grid-template-columns: 1fr; } aside { position: static; } }
      `}</style>
      <div className="checklist-container">
        <main>
            <div id="docArea">
              {/* SUMMARY */}
              <section className="checklist-card" aria-labelledby="summary-title">
                  <div className="section-head">
                    <div className="section-title">
                      <div className="icon">📋</div>
                      <div>
                        <h2 id="summary-title">Resumo da Entrega</h2>
                        <div className="muted">Versão: 1.0.0 • Data: {new Date().toLocaleDateString('pt-BR')}</div>
                      </div>
                    </div>
                  </div>
                  <p className="muted-note">Este documento reúne a documentação técnica, checklists, diagramas e informações de deploy para a transferência completa do projeto UCS Index Platform.</p>
              </section>

              {/* DIAGRAMS */}
               <section className="card">
                <div className="section-title">
                    <div className="icon">🗺️</div>
                    <div>
                        <h2>Diagramas</h2>
                        <div className="muted">Arquitetura, Fluxo de Dados e Infraestrutura</div>
                    </div>
                </div>
                <div style={{ marginTop: '12px' }}>
                    <h3>Arquitetura Técnica</h3>
                    <p className="muted-note">Visão geral dos componentes principais: Front-end (Next.js), Camada de API (Serverless), Banco de Dados (Firestore) e integrações (N8N, Google AI).</p>
                    <div className="diagram" role="img" aria-label="Diagrama de arquitetura técnica" onClick={(e) => e.currentTarget.classList.toggle('zoomed')}>
                        <svg viewBox="0 0 1000 360" width="100%" xmlns="http://www.w3.org/2000/svg">
                            {/* SVG content for Arquitetura Técnica */}
                        </svg>
                    </div>
                </div>
                 <div style={{ marginTop: '18px' }}>
                    <h3>Fluxo de Dados</h3>
                    <p className="muted-note">Ilustra como os dados fluem desde as fontes externas (N8N), são armazenados no Firestore, e consumidos pela aplicação web e pela IA.</p>
                    <div className="diagram" role="img" aria-label="Fluxo de dados" onClick={(e) => e.currentTarget.classList.toggle('zoomed')}>
                       <svg viewBox="0 0 1000 160" width="100%" xmlns="http://www.w3.org/2000/svg">
                          {/* SVG content for Fluxo de Dados */}
                       </svg>
                    </div>
                </div>
                <div style={{ marginTop: '18px' }}>
                    <h3>Infraestrutura de Deploy</h3>
                     <p className="muted-note">Mostra o pipeline de CI/CD do GitHub Actions e os alvos de deploy, incluindo Vercel, Hostinger/Locaweb, e a VPS para N8N.</p>
                    <div className="diagram" role="img" aria-label="Infraestrutura de deploy" onClick={(e) => e.currentTarget.classList.toggle('zoomed')}>
                       <svg viewBox="0 0 1000 220" width="100%" xmlns="http://www.w3.org/2000/svg">
                          {/* SVG content for Infraestrutura de Deploy */}
                       </svg>
                    </div>
                </div>
              </section>

              {/* CHECKLIST */}
              <section className="checklist-card" style={{marginTop: '18px'}}>
                  <div className="section-head">
                    <div className="section-title">
                      <div className="icon">✅</div>
                      <h2>Checklist de Entrega</h2>
                    </div>
                  </div>
                  <div style={{marginTop: '12px'}}>
                    {/* PRÉ-ENTREGA */}
                    <div className="collapsible" data-target="preEntrega">
                      <div className="title"><strong>📋 Pré-Entrega</strong></div>
                      <div className="chev">▸</div>
                    </div>
                    <div id="preEntrega" className="coll-content">
                      <h3>🏗️ Desenvolvimento Concluído</h3>
                      <ul className="checklist-list">
                        <li className="checklist-item"><label><input type="checkbox" data-key="pre_dev_func"/><span className="txt">Todas as funcionalidades implementadas</span></label></li>
                        <li className="checklist-item"><label><input type="checkbox" data-key="pre_dev_tests"/><span className="txt">Testes locais realizados</span></label></li>
                      </ul>
                       <h3>📚 Documentação Completa</h3>
                       <ul className="checklist-list">
                        <li className="checklist-item"><label><input type="checkbox" data-key="pre_doc_readme"/><span className="txt">README.md atualizado</span></label></li>
                       </ul>
                    </div>
                    
                    {/* ENTREGA */}
                    <div className="collapsible" data-target="entrega">
                      <div className="title"><strong>🚀 Entrega</strong></div>
                      <div className="chev">▸</div>
                    </div>
                    <div id="entrega" className="coll-content">
                      <h3>📦 Arquivos Entregues</h3>
                      <ul className="checklist-list">
                          <li className="checklist-item"><label><input type="checkbox" data-key="entrega_code"/><span className="txt">Código-fonte completo</span></label></li>
                          <li className="checklist-item"><label><input type="checkbox" data-key="entrega_doc"/><span className="txt">Documentação técnica</span></label></li>
                      </ul>
                       <h3>🔑 Credenciais e Acessos</h3>
                       <ul className="checklist-list">
                        <li className="checklist-item"><label><input type="checkbox" data-key="cred_firebase"/><span className="txt">Firebase: Projeto criado e configurado</span></label></li>
                       </ul>
                    </div>
                    
                    {/* TESTES */}
                    <div className="collapsible" data-target="testes">
                        <div className="title"><strong>🔍 Testes de Aceite</strong></div>
                        <div className="chev">▸</div>
                    </div>
                    <div id="testes" className="coll-content">
                        <h3>✅ Testes Funcionais</h3>
                        <ul className="checklist-list">
                            <li className="checklist-item"><label><input type="checkbox" data-key="test_func_login" /><span className="txt">Usuário consegue fazer login</span></label></li>
                            <li className="checklist-item"><label><input type="checkbox" data-key="test_func_dashboard" /><span className="txt">Dashboard exibe dados em tempo real</span></label></li>
                        </ul>
                         <h3>✅ Testes de Performance</h3>
                        <ul className="checklist-list">
                            <li className="checklist-item"><label><input type="checkbox" data-key="test_perf_load" /><span className="txt">Carregamento inicial &lt; 3 segundos</span></label></li>
                        </ul>
                    </div>

                    {/* SEGURANÇA */}
                    <div className="collapsible" data-target="seguranca">
                        <div className="title"><strong>🛡️ Segurança e LGPD</strong></div>
                        <div className="chev">▸</div>
                    </div>
                    <div id="seguranca" className="coll-content">
                        <h3>🔐 Autenticação e Autorização</h3>
                        <ul className="checklist-list">
                            <li className="checklist-item"><label><input type="checkbox" data-key="sec_auth_login" /><span className="txt">Login seguro implementado</span></label></li>
                        </ul>
                    </div>

                    {/* DEPLOY */}
                    <div className="collapsible" data-target="deploy">
                        <div className="title"><strong>🚀 Deploy</strong></div>
                        <div className="chev">▸</div>
                    </div>
                    <div id="deploy" className="coll-content">
                        <h3>🌐 Produção</h3>
                        <ul className="checklist-list">
                            <li className="checklist-item"><label><input type="checkbox" data-key="deploy_prod_build" /><span className="txt">Build de produção gerado</span></label></li>
                        </ul>
                    </div>

                    {/* Assinaturas */}
                    <div className="collapsible" data-target="assinaturas">
                        <div className="title"><strong>✅ Assinaturas</strong></div>
                        <div className="chev">▸</div>
                    </div>
                    <div id="assinaturas" className="coll-content">
                        <div style={{display:'flex', gap:'12px', marginTop:'8px', flexWrap:'wrap'}}>
                            <div style={{flex:'1', minWidth:'220px'}}>
                                <div style={{fontSize:'13px', color:'var(--muted)'}}>Desenvolvedor</div>
                                <input id="sigDevName" className="sig-input" placeholder="Nome do desenvolvedor" />
                            </div>
                            <div style={{minWidth:'200px'}}>
                                <div style={{fontSize:'13px', color:'var(--muted)'}}>Data</div>
                                <input id="sigDevDate" type="date" className="sig-input" />
                            </div>
                        </div>
                        <div style={{display:'flex', gap:'12px', marginTop:'12px', flexWrap:'wrap'}}>
                            <div style={{flex:'1', minWidth:'220px'}}>
                                <div style={{fontSize:'13px', color:'var(--muted)'}}>Cliente</div>
                                <input id="sigClientName" className="sig-input" placeholder="Nome do cliente" />
                            </div>
                            <div style={{minWidth:'200px'}}>
                                <div style={{fontSize:'13px', color:'var(--muted)'}}>Data</div>
                                <input id="sigClientDate" type="date" className="sig-input" />
                            </div>
                        </div>
                    </div>
                  </div>
              </section>
            </div>
            <footer style={{marginTop: '18px', textAlign: 'center'}}>
                <div className="muted">Progresso salvo no navegador. Use "Exportar PDF" para gerar o documento final.</div>
            </footer>
        </main>
        <aside>
          <div className="sticky">
            <div className="checklist-card">
              <div className="panel-title">📊 Progresso</div>
              <div style={{textAlign:'center', margin:'16px 0'}}>
                <div style={{fontSize: '48px', fontWeight: 800}} id="progressBig">0%</div>
                <div style={{fontSize: '14px', color:'var(--muted)', marginTop:'8px'}}>
                  <span id="completedItems">0</span> de <span id="totalItems">0</span> itens concluídos
                </div>
                <div style={{marginTop:'12px'}}>
                  <div className="progress-bar-container" style={{width:'100%', height:'8px'}}>
                    <div className="progress-bar-fill" id="progressFillSidebar" style={{width:'0%'}}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="checklist-card">
              <div className="panel-title">⚡ Ações Rápidas</div>
              <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                 <Button id="exportPdf" size="sm">Exportar PDF</Button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
    

    
