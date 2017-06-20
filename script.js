function loanCalculator() {
  this.amountElem = document.getElementById("amount");
  this.aprElem = document.getElementById("apr");
  this.yearsElem = document.getElementById("years");
  this.zipcodeElem = document.getElementById("zipcode");
  this.calcBtnElem = document.getElementById("calc");

  this.paymentElem = document.getElementById("payment");
  this.totalElem = document.getElementById("total");
  this.totalinterestElem = document.getElementById("totalinterest");
  this.graphElem = document.getElementById("graph");
  this.lendersElem = document.getElementById("lenders");

  this.principal = null;
  this.apr = null;
  this.interest = null;   // monthly interest
  this.years = null;
  this.payments = null;   // total number of payments
  this.zipcode = null;

  this.monthlyPayment = null;
  this.totalPayment = null;
  this.totalInterest = null;

  this.gWidth = null;
  this.gHeight = null;
  this.gObject = null;
};

loanCalculator.prototype.getPrinciple = function() {
  this.principal = parseFloat(this.amountElem.value);
};

loanCalculator.prototype.getInterest = function() {
  this.apr = this.aprElem.value;
  this.interest = parseFloat(this.apr) / 100 / 12;
};

loanCalculator.prototype.getPayments = function() {
  this.years = this.yearsElem.value;
  this.payments = parseFloat(this.years) * 12;
};

loanCalculator.prototype.getZipcode = function() {
  this.zipcode = parseInt(this.zipcodeElem.value);
};

loanCalculator.prototype.calculatePayment = function () {
  var x = Math.pow(1 + this.interest, this.payments);
  var monthpay = (this.principal * x * this.interest) / (x-1);
  var total = monthpay * this.payments;
  this.monthlyPayment = monthpay.toFixed(2);
  this.totalPayment = total.toFixed(2);
  this.totalInterest = (total - this.principal).toFixed(2);
}

loanCalculator.prototype.clearTableChart = function() {
  this.paymentElem.innerHTML = "";
  this.totalElem.innerHTML = "";
  this.totalinterestElem.innerHTML = "";
  this.renderChart();
}

loanCalculator.prototype.renderTableContent = function () {
    this.paymentElem.textContent = this.monthlyPayment;
    this.totalElem.textContent = this.totalPayment;
    this.totalinterestElem.textContent = this.totalInterest;
};

loanCalculator.prototype.getChartSize = function() {
  this.gWidth = this.graphElem.width;
  this.gHeight = this.graphElem.height;
  this.gObject = this.graphElem.getContext("2d");
};

loanCalculator.prototype.renderChart = function (principal, interest, monthly, payments) {
  this.graphElem.width = this.graphElem.width; // Magic to clear and reset the canvas element
  if (arguments.length == 0) {
    return;
  }

  var g = this.gObject;
  var width = this.gWidth;
  var height = this.gHeight;

  // These functions convert payment numbers and dollar amounts to pixels
  function paymentToX(n) {
    return n * width / payments;
  }

  function amountToY(a) {
    return height - (a * height / (monthly * payments * 1.05));
  }

  // Payments are a straight line from (0,0) to (payments, monthly*payments)
  g.moveTo(paymentToX(0), amountToY(0)); // Start at lower left
  g.lineTo(paymentToX(payments), amountToY(monthly*payments)); // Draw to upper right
  g.lineTo(paymentToX(payments), amountToY(0)); // Down to lower right
  g.closePath(); // And back to start
  g.fillStyle = "#f88"; // Light red
  g.fill(); // Fill the triangle
  g.font = "bold 12px sans-serif"; // Define a font
  g.fillText("Total Interest Payments", 20, 20); // Draw text in legend

  // Cumulative equity is non-linear and trickier to chart
  var equity = 0;
  g.beginPath(); // Begin a new shape
  g.moveTo(paymentToX(0), amountToY(0)); // starting at lower-left
  for(var p = 1; p <= payments; p++) {
    // For each payment, figure out how much is interest
    var thisMonthsInterest = (principal-equity)*interest;
    equity += (monthly - thisMonthsInterest); // The rest goes to equity
    g.lineTo(paymentToX(p),amountToY(equity)); // Line to this point
  }
  g.lineTo(paymentToX(payments), amountToY(0)); // Line back to X axis
  g.closePath(); // And back to start point
  g.fillStyle = "green"; // Now use green paint
  g.fill(); // And fill area under curve
  g.fillText("Total Equity", 20,35); // Label it in green

  // Loop again, as above, but chart loan balance as a thick black line
  var bal = principal;
  g.beginPath();
  g.moveTo(paymentToX(0),amountToY(bal));
  for(var p = 1; p <= payments; p++) {
    var thisMonthsInterest = bal*interest;
    bal -= (monthly - thisMonthsInterest); // The rest goes to equity
    g.lineTo(paymentToX(p),amountToY(bal)); // Draw line to this point
  }
  g.lineWidth = 3; // Use a thick line
  g.stroke(); // Draw the balance curve
  g.fillStyle = "black"; // Switch to black text
  g.fillText("Loan Balance", 20,50); // Legend entry

  // Now make yearly tick marks and year numbers on X axis
  g.textAlign="center"; // Center text over ticks
  var y = amountToY(0); // Y coordinate of X axis
  for(var year=1; year*12 <= payments; year++) { // For each year
    var x = paymentToX(year*12); // Compute tick position
    g.fillRect(x-0.5,y-3,1,3); // Draw the tick
    if (year == 1) g.fillText("Year", x, y-5); // Label the axis
    if (year % 5 == 0 && year*12 !== payments) // Number every 5 years
    g.fillText(String(year), x, y-5);
  }
  // Mark payment amounts along the right edge
  g.textAlign = "right"; // Right-justify text
  g.textBaseline = "middle"; // Center it vertically
  var ticks = [monthly*payments, principal]; // The two points we'll mark
  var rightEdge = paymentToX(payments); // X coordinate of Y axis
  for(var i = 0; i < ticks.length; i++) { // For each of the 2 points
    var y = amountToY(ticks[i]); // Compute Y position of tick

    g.fillRect(rightEdge-3, y-0.5, 3,1); // Draw the tick mark
    g.fillText(String(ticks[i].toFixed(0)), rightEdge-5, y); // And label it.
  }
};

loanCalculator.prototype.mainProcess = function () {
  this.calculatePayment();
  // If the result is a finite number, the user's input was good and
  // we have meaningful results to display
  if (isFinite(this.monthlyPayment)){
    this.renderTableContent();

    // Advertise: find and display local lenders, but ignore network errors
    try { // Catch any errors that occur within these curly braces
      this.getLenders(this.principal, this.apr, this.years, this.zipcode);
    }

    catch(e) { /* And ignore those errors */ }

    // Finally, chart loan balance, and interest and equity payments
    this.renderChart(this.principal, this.interest, this.monthlyPayment, this.payments);
  }
  else {
    // Result was Not-a-Number or infinite, which means the input was
    // incomplete or invalid. Clear any previously displayed output.
    this.clearTableChart();
  }
};

loanCalculator.prototype.createRequest = function() {
  var request;
    if(window.XMLHttpRequest){
        request  = new XMLHttpRequest();
    }else{
        request = new ActiveXObject();
    }
   return request;
};

loanCalculator.prototype.getLenders = function(amount, apr, years, zipcode) {
  var xhr = this.createRequest();
  var lendersElem = this.lendersElem;
  var url = "lenders.json"
          + "?amt=" + amount
          + "&apr=" + apr
          + "&yrs=" + years
          + "&zip=" + zipcode;
  xhr.open("GET", url, true);
  xhr.onreadystatechange = function() {
      if (xhr.readyState == 4 && xhr.status == 200) {
        var lenders = JSON.parse(xhr.responseText);
        var list = "";
        for(var i = 0; i < lenders.length; i++) {
          list += "<li><a href='" + lenders[i].url + "'>" +
          lenders[i].name + "</a>";
        }
        // Display the HTML in the element from above.
        lendersElem.innerHTML = "<ul>" + list + "</ul>";
      }
  };
  xhr.send();
};

window.onload = function() {
    var loanCalc = new loanCalculator();
    loanCalc.getChartSize();
    loanCalc.amountElem.addEventListener("change", loanCalc.getPrinciple.bind(loanCalc));
    loanCalc.aprElem.addEventListener("change", loanCalc.getInterest.bind(loanCalc));
    loanCalc.yearsElem.addEventListener("change", loanCalc.getPayments.bind(loanCalc));
    loanCalc.zipcodeElem.addEventListener("change", loanCalc.getZipcode.bind(loanCalc));
    loanCalc.calcBtnElem.addEventListener("click", loanCalc.mainProcess.bind(loanCalc));
};