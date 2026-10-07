(function () {
  'use strict';
  const elements = [document.querySelector('nav'), document.querySelector('[data-testid="primaryColumn"]'), document.querySelector('[data-testid="sidebarColumn"]'), ...document.querySelectorAll('article[data-testid="tweet"]')];
  const geometry = () => elements.map(element => {
    const rect = element.getBoundingClientRect();
    return {left:rect.left+scrollX, top:rect.top+scrollY, width:rect.width, height:rect.height, children:element.children.length};
  });
  const baseline = document.createElement('script');
  baseline.type='application/json';baseline.id='layout-baseline';
  baseline.textContent=JSON.stringify(geometry());document.body.append(baseline);
  const check = document.createElement('button');check.textContent='检查布局';check.id='layout-check';
  const report = document.createElement('p');report.id='layout-report';report.setAttribute('aria-live','polite');
  const toolbar=document.querySelector('.toolbar');toolbar.append(check,report);
  check.addEventListener('click',()=>{
    const initial=JSON.parse(baseline.textContent),current=geometry();
    const changed=current.some((rect,index)=> ['left','top','width',...(index===0?[]:['height','children'])].some(key=>Math.abs(rect[key]-initial[index][key])>0.1));
    report.textContent=changed?'检测到原页面几何变化（调整窗口后请刷新建立新基线）':'✓ 左栏 / 信息流 / 帖子尺寸与位置均未改变';
  });
})();
