// 引流页交互

document.addEventListener('DOMContentLoaded', () => {
  // FAQ 展开/收起
  const faqQuestions = document.querySelectorAll('.faq-question');
  
  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      const item = question.parentElement;
      const isActive = item.classList.contains('active');
      
      // 关闭所有其他
      document.querySelectorAll('.faq-item').forEach(i => {
        i.classList.remove('active');
      });
      
      // 切换当前
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
  
  // 平滑滚动
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});
