(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[701],{996:function(e,t,a){(window.__NEXT_P=window.__NEXT_P||[]).push(["/faturamento",function(){return a(9391)}])},9391:function(e,t,a){"use strict";a.r(t);var r=a(5893),n=a(7294),o=a(2600),s=a(109),i=a(5706),c=a.n(i);t.default=()=>{let[e,t]=(0,n.useState)(0),[a,i]=(0,n.useState)(0),[l,d]=(0,n.useState)(!0),h=async()=>{let e=0;try{(await (0,s.PL)((0,s.hJ)(o.db,"Vendas"))).forEach(t=>{let a=t.data();e+=a.ValorTotal}),t(e)}catch(e){console.error("Erro ao buscar receitas:",e)}},u=async()=>{let e=0;try{(await (0,s.PL)((0,s.hJ)(o.db,"Vendedor"))).forEach(t=>{let a=t.data(),r=a.Salario||0,n=20*(a.VendasMes||0);e+=r+n}),i(e)}catch(e){console.error("Erro ao buscar despesas:",e)}};return(0,n.useEffect)(()=>{d(!0),(async()=>{await h(),await u(),d(!1)})()},[]),(0,r.jsxs)("div",{className:c().faturamento,children:[(0,r.jsx)("h1",{children:"Faturamento"}),l?(0,r.jsx)("p",{children:"Carregando..."}):(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("h2",{children:"Receitas"}),(0,r.jsxs)("table",{className:c().table,children:[(0,r.jsx)("thead",{children:(0,r.jsx)("tr",{children:(0,r.jsx)("th",{children:"Total de Receitas"})})}),(0,r.jsx)("tbody",{children:(0,r.jsx)("tr",{children:(0,r.jsx)("td",{children:`R$ ${e.toFixed(2)}`})})})]}),(0,r.jsx)("h2",{children:"Despesas"}),(0,r.jsxs)("table",{className:c().table,children:[(0,r.jsx)("thead",{children:(0,r.jsx)("tr",{children:(0,r.jsx)("th",{children:"Total de Despesas"})})}),(0,r.jsx)("tbody",{children:(0,r.jsx)("tr",{children:(0,r.jsx)("td",{children:`R$ ${a.toFixed(2)}`})})})]})]})]})}},5706:function(e){e.exports={faturamentoContainer:"Faturamento_faturamentoContainer__Hvmx6",notification:"Faturamento_notification__DqvPa",filtroContainer:"Faturamento_filtroContainer__pcBb1",dateRangePicker:"Faturamento_dateRangePicker__G2oD_",gerarRelatorioButton:"Faturamento_gerarRelatorioButton__Uhe7o",faturamentoTable:"Faturamento_faturamentoTable__CbTym",totalContainer:"Faturamento_totalContainer__5corW"}}},function(e){e.O(0,[888,774,179],function(){return e(e.s=996)}),_N_E=e.O()}]);