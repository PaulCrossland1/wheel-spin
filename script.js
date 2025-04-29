document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const wheel = document.getElementById('wheel');
    const spinButton = document.getElementById('spin-button');
    const addEntryButton = document.getElementById('add-entry');
    const newEntryInput = document.getElementById('new-entry');
    const entriesList = document.getElementById('entries-list');
    const resultDisplay = document.getElementById('result');
    const settingsIcon = document.querySelector('.settings-icon');
    const settingsPanel = document.getElementById('settings-panel');
    const closeSettingsButton = document.getElementById('close-settings');
    const wheelBgColorInput = document.getElementById('wheel-bg-color');
    const textColorInput = document.getElementById('text-color');
    const helpButton = document.getElementById('help-button');
    const winnerModal = document.getElementById('winner-modal');
    const winnerName = document.getElementById('winner-name');
    const closeModalButton = document.getElementById('close-modal');
    const confettiCanvas = document.getElementById('confetti-canvas');
    
    // Set up confetti canvas
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    
    // Adjust canvas on window resize
    window.addEventListener('resize', function() {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    });
    
    // Wheel properties
    const canvas = wheel;
    const ctx = canvas.getContext('2d');
    let entries = [];
    let spinning = false;
    let wheelColors = [
        '#ff6b81', '#5f27cd', '#54a0ff', '#1dd1a1', 
        '#feca57', '#ff9ff3', '#00d2d3', '#48dbfb', 
        '#ff9f43', '#c8d6e5', '#576574', '#222f3e'
    ];
    let spinAngle = 0;
    let currentRotation = 0;
    let spinTime = 0;
    let spinTimeTotal = 0;
    let wheelBgColor = '#2c3e50';
    let textColor = '#ffffff';
    
    // Add sample entries
    addEntry('Player 1');
    addEntry('Player 2');
    addEntry('Player 3');
    
    // Event listeners
    addEntryButton.addEventListener('click', function() {
        addEntryFromInput();
    });
    
    newEntryInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
                addEntryFromInput();
        }
    });
    
    spinButton.addEventListener('click', function() {
        if (!spinning && entries.length > 1) {
            startSpin();
        } else if (entries.length <= 1) {
            // Show a notification that more entries are needed
            showNotification("Need at least 2 entries to spin!", "error");
        }
    });
    
    settingsIcon.addEventListener('click', function() {
        settingsPanel.style.display = 'block';
    });
    
    closeSettingsButton.addEventListener('click', function() {
        settingsPanel.style.display = 'none';
    });
    
    wheelBgColorInput.addEventListener('change', function() {
        wheelBgColor = this.value;
        drawWheel();
    });
    
    textColorInput.addEventListener('change', function() {
        textColor = this.value;
        drawWheel();
    });
    
    closeModalButton.addEventListener('click', function() {
        winnerModal.classList.remove('active');
    });
    
    // Functions
    function addEntryFromInput() {
        const input = newEntryInput.value.trim();
        if (input) {
            // Check if input contains commas for multiple entries
            if (input.includes(',')) {
                // Split by commas and process as bulk entries
            const newEntries = input.split(',')
                .map(entry => entry.trim())
                .filter(entry => entry.length > 0);
            
            if (newEntries.length > 0) {
                    showNotification(`Adding ${newEntries.length} entries...`, "info");
                
                // Add entries with a slight delay to allow UI updates
                let index = 0;
                const addNextEntry = () => {
                    if (index < newEntries.length) {
                        addEntry(newEntries[index]);
                        index++;
                        setTimeout(addNextEntry, 50); // Small delay between additions
                    } else {
                            // All entries added
                            showNotification(`Added ${newEntries.length} entries!`, "success");
                    }
                };
                
                addNextEntry();
                }
            } else {
                // Single entry
                addEntry(input);
            }
            
            newEntryInput.value = '';
            newEntryInput.focus();
        }
    }
    
    function showNotification(message, type = "info") {
            const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
            notification.style.position = 'fixed';
            notification.style.bottom = '20px';
            notification.style.right = '20px';
            notification.style.padding = '10px 20px';
            notification.style.borderRadius = '8px';
            notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
            notification.style.zIndex = '1000';
        notification.style.color = 'white';
        
        // Set background color based on notification type
        if (type === "error") {
            notification.style.background = 'rgba(231, 76, 60, 0.9)';
        } else if (type === "success") {
            notification.style.background = 'rgba(46, 204, 113, 0.9)';
        } else {
            notification.style.background = 'rgba(52, 152, 219, 0.9)';
        }
        
            document.body.appendChild(notification);
            
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 2000);
    }
            
    function addEntry(text) {
        // Don't add duplicate entries
        if (entries.includes(text)) {
            showNotification(`"${text}" is already in the wheel!`, "error");
            return;
        }
        
        entries.push(text);
        
        const entryItem = document.createElement('div');
        entryItem.className = 'entry-item';
        
        const entryText = document.createElement('div');
        entryText.className = 'entry-text';
        entryText.textContent = text;
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-entry';
        deleteButton.innerHTML = '&times;';
        deleteButton.addEventListener('click', function() {
            const index = entries.indexOf(text);
            if (index > -1) {
                entries.splice(index, 1);
                entriesList.removeChild(entryItem);
                drawWheel();
            }
        });
        
        entryItem.appendChild(entryText);
        entryItem.appendChild(deleteButton);
        entriesList.appendChild(entryItem);
        
        // Auto scroll to the bottom of the entries list
        entriesList.scrollTop = entriesList.scrollHeight;
        
        drawWheel();
    }
    
    function drawWheel() {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (entries.length === 0) {
            return;
        }
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) * 0.9;
        
        // Draw wheel background
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = wheelBgColor;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#fff';
        ctx.stroke();
        
        // Draw segments
        const arc = (2 * Math.PI) / entries.length;
        
        for (let i = 0; i < entries.length; i++) {
            const angle = i * arc + currentRotation;
            
            // Draw segment
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, angle, angle + arc);
            ctx.lineTo(centerX, centerY);
            ctx.fillStyle = wheelColors[i % wheelColors.length];
            ctx.fill();
            ctx.stroke();
            
            // Draw text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(angle + arc / 2);
            
            const text = entries[i];
            ctx.fillStyle = textColor;
            ctx.font = 'bold 16px Poppins, Arial';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            
            // Calculate text position - adjust for longer text
            const textRadius = radius * 0.8;
            // If text is too long, reduce font size
            if (text.length > 15) {
                ctx.font = 'bold 14px Poppins, Arial';
            }
            if (text.length > 25) {
                ctx.font = 'bold 12px Poppins, Arial';
            }
            
            ctx.fillText(text, textRadius, 0);
            ctx.restore();
        }
        
        // Draw center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.1, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.stroke();
    }
    
    function startSpin() {
        if (spinning) return;
        spinning = true;
        resultDisplay.textContent = '';
        
        // Spin duration set to 30 seconds (30000ms)
        spinTimeTotal = 30000;
        spinTime = 0;
        spinAngle = 0;
        
        // Minimum angle for rotations remains the same
        const baseAngle = 2 * Math.PI * 10; // At least 10 full rotations
        const extraAngle = Math.random() * (2 * Math.PI * 5); // Random extra up to 5 more rotations
        spinAngle = baseAngle + extraAngle;
        
        rotateWheel();
    }
    
    function rotateWheel() {
        spinTime += 30; // Assuming ~33fps, adjust if needed
        if (spinTime >= spinTimeTotal) {
            stopRotateWheel();
            return;
        }
        
        // Use the updated easing function
        const currentSpinAngle = enhancedEaseOut(spinTime, 0, spinAngle, spinTimeTotal);
        currentRotation = currentSpinAngle; // Directly set rotation based on easing output
        
        drawWheel();
        requestAnimationFrame(rotateWheel);
    }
     
    // Updated easing function for 30s spin: 2s ramp up, 20.5s constant, 7.5s ramp down
    function enhancedEaseOut(t, b, c, d) {
        const time1 = 2000; // Ramp up duration (ms)
        const time3 = 7500; // Ramp down duration (ms)
        const time2 = d - time1 - time3; // Constant speed duration (ms) = 20500ms
        
        const totalAngle = c; // c is the total change (spinAngle)
        
        // Calculate max speed and angle covered in each phase
        // maxSpeed = totalAngle / (time1/2 + time2 + time3/2)
        const denominator = (time1 / 2) + time2 + (time3 / 2); // 1000 + 20500 + 3750 = 25250
        const maxSpeed = totalAngle / denominator;
        const angle1 = maxSpeed * (time1 / 2); // Angle during ramp up
        const angle2 = maxSpeed * time2;       // Angle during constant speed
        const angle3 = maxSpeed * (time3 / 2); // Angle during ramp down
        
        // Phase 1: Ramp Up (Quadratic Ease In)
        if (t < time1) {
            const progress = t / time1;
            return b + angle1 * progress * progress;
        }
        // Phase 2: Constant Speed (Linear)
        else if (t < time1 + time2) {
            const progress = (t - time1) / time2;
            return b + angle1 + angle2 * progress;
        }
        // Phase 3: Ramp Down (Cubic Ease Out)
        else {
            const progress = (t - time1 - time2) / time3;
            // Use (1 - (1-progress)^3) for cubic ease out
            return b + angle1 + angle2 + angle3 * (1 - Math.pow(1 - progress, 3));
        }
    }
    
    function stopRotateWheel() {
        spinning = false;
        
        // Calculate the winner
        const arc = (2 * Math.PI) / entries.length;
        const angleOffset = (currentRotation % (2 * Math.PI));
        let selectedIndex = Math.floor((2 * Math.PI - angleOffset) / arc) % entries.length;
        
        // Account for precision issues - make sure index is valid
        if (selectedIndex < 0) selectedIndex = 0;
        if (selectedIndex >= entries.length) selectedIndex = entries.length - 1;
        
        const winner = entries[selectedIndex];
        
        // Update result display with animation
        resultDisplay.style.transform = 'scale(0.5)';
        resultDisplay.style.opacity = '0';
        
        setTimeout(() => {
            resultDisplay.textContent = `Winner: ${winner}`;
            resultDisplay.style.transform = 'scale(1)';
            resultDisplay.style.opacity = '1';
            
            // Show winner in modal and trigger confetti
            showWinner(winner);
        }, 500);
    }
    
    function showWinner(winner) {
        // Update modal content
        winnerName.textContent = winner;
        
        // Show modal with animation
        setTimeout(() => {
            winnerModal.classList.add('active');
            
            // Start confetti effect
            startConfetti();
        }, 800);
    }
    
    function startConfetti() {
        // Use the canvas-confetti library
        const myConfetti = confetti.create(confettiCanvas, { 
            resize: true,
            useWorker: true
        });
        
        // Fire full-screen confetti
        const end = Date.now() + 5000; // 5 seconds duration
        
        // Fire multiple bursts of confetti
        const colors = ['#ff6b81', '#5f27cd', '#54a0ff', '#1dd1a1', '#feca57', '#ff9ff3'];
        
        (function frame() {
            // Launch confetti from the sides
            myConfetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.65 },
                colors: colors
            });
            
            myConfetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 0.65 },
                colors: colors
            });
            
            // Fire more dense confetti from the top
            myConfetti({
                particleCount: 6,
                angle: 130,
                spread: 100,
                origin: { x: 0.5, y: 0 },
                colors: colors
            });
            
            // Keep going until time runs out
            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
        
        // Fire one big burst in the middle
        myConfetti({
            particleCount: 150,
            spread: 120,
            origin: { y: 0.6 },
            colors: colors,
            gravity: 0.8
        });
    }
    
    function easeOut(t, b, c, d) {
        const ts = (t /= d) * t;
        const tc = ts * t;
        return b + c * (tc + -3 * ts + 3 * t);
    }
    
    // Utility function to convert hex color to rgba
    function hexToRgb(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    // Initial wheel drawing
    drawWheel();
});