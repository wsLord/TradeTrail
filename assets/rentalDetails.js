// rentalDetails.js

document.addEventListener('DOMContentLoaded', () => {
    const rate = document.getElementById('rateValue').textContent;
    const pricePerUnit = parseFloat(document.getElementById('priceValue').textContent);
    const deposit = parseFloat(document.getElementById('depositValue').textContent);
    const startInput = document.getElementById('rentalStart');
    const endInput = document.getElementById('rentalEnd');
    const totalSpan = document.getElementById('totalPrice');
    const dynamicPriceSpans = document.querySelectorAll('#dynamicPrice, #dynamicPrice2');
    const calculationDetails = document.getElementById('calculationDetails');
  
    function calculateTotal() {
      if (startInput.value && endInput.value) {
        const start = new Date(startInput.value);
        const end = new Date(endInput.value);
        
        if (start >= end) {
          calculationDetails.innerHTML = '<p class="text-danger">End date must be after start date</p>';
          return;
        }
  
        const diffTime = end - start;
        let units, unitLabel;
  
        switch(rate) {
          case 'hour':
            units = Math.ceil(diffTime / (1000 * 60 * 60));
            unitLabel = 'hours';
            break;
          case 'day':
            units = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            unitLabel = 'days';
            break;
          case 'week':
            units = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
            unitLabel = 'weeks';
            break;
          case 'month':
            units = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
            unitLabel = 'months';
            break;
        }
  
        const rentalCost = units * pricePerUnit;
        const total = rentalCost + deposit;
        
        calculationDetails.innerHTML = `
          ${units} ${unitLabel} × ₹${pricePerUnit}/${rate}<br>
          + ₹${deposit} security deposit
        `;
  
        totalSpan.textContent = total.toFixed(2);
        dynamicPriceSpans.forEach(span => span.textContent = total.toFixed(2));
      }
    }
  
    startInput.addEventListener('change', () => {
      endInput.min = startInput.value;
      calculateTotal();
    });
  
    endInput.addEventListener('change', calculateTotal);
  });
  