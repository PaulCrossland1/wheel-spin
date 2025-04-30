document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const wheel = document.getElementById('wheel');
    const spinButton = document.getElementById('spin-button');
    const addEntryButton = document.getElementById('add-entry');
    const newEntryInput = document.getElementById('new-entry');
    const entriesList = document.getElementById('entries-list');
    const resultDisplay = document.getElementById('result');
    const winnerModal = document.getElementById('winner-modal');
    const winnerName = document.getElementById('winner-name');
    const closeModalButton = document.getElementById('close-modal');
    const confettiCanvas = document.getElementById('confetti-canvas');
    
    // Offscreen canvas for pre-rendering
    const offscreenCanvas = document.createElement('canvas');
    const offscreenCtx = offscreenCanvas.getContext('2d');
    let wheelImageRendered = false; // Flag to track if wheel is pre-rendered

    // Set up confetti canvas
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    
    // Adjust canvas on window resize
    window.addEventListener('resize', function() {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
        // Potentially re-render wheel if main canvas size changes
        // For now, assume fixed main canvas size after init
    });
    
    // Main Wheel properties
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
    let wheelBgColor = '#ffffff';
    let textColor = '#ffffff';
    let wheelFrameColor = '#ffffff';
    let isFirstUserEntry = true; 
    
    // Add sample entries initially & pre-render
    const placeholderNames = ['Player 1', 'Player 2', 'Player 3'];
    placeholderNames.forEach(name => addEntry(name, false)); // Add without drawing yet
    preRenderWheel(); // Pre-render the initial state
    drawWheel(); // Draw the pre-rendered wheel once
    
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
            showNotification("Need at least 2 entries to spin!", "error");
        }
    });
    
    closeModalButton.addEventListener('click', function() {
        winnerModal.classList.remove('active');
    });
    
    // Functions
    function addEntryFromInput() {
        const input = newEntryInput.value.trim();
        if (input) {
            let requiresPreRender = false; // Flag if pre-render needed
            if (isFirstUserEntry) {
                const currentItems = Array.from(entriesList.querySelectorAll('.entry-item'));
                currentItems.forEach(item => {
                    const textElement = item.querySelector('.entry-text');
                    if (textElement && placeholderNames.includes(textElement.textContent)) {
                        entriesList.removeChild(item);
                    }
                });
                entries = entries.filter(entry => !placeholderNames.includes(entry));
                isFirstUserEntry = false;
                requiresPreRender = true; // Need to re-render after clearing
            }

            if (input.includes(',')) {
                const newEntries = input.split(',')
                    .map(entry => entry.trim())
                    .filter(entry => entry.length > 0);
                
                if (newEntries.length > 0) {
                    showNotification(`Adding ${newEntries.length} entries...`, "info");
                    newEntries.forEach(entryText => addEntry(entryText, false)); // Add without drawing
                    requiresPreRender = true;
                    setTimeout(() => {
                        showNotification(`Added ${newEntries.length} entries!`, "success");
                    }, 50 * newEntries.length + 100); // Show after entries added
                }
            } else {
                addEntry(input, false); // Add single entry without drawing
                requiresPreRender = true;
            }
            
            if (requiresPreRender) {
                preRenderWheel(); // Re-render the offscreen canvas
                drawWheel(); // Draw the updated wheel to the main canvas
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
            
    function addEntry(text, shouldDraw = true) {
        if (entries.includes(text)) {
            showNotification(`"${text}" is already in the wheel!`, "error");
            return;
        }
        entries.push(text);
        
        // --- DOM manipulation for the list --- START
        const entryItem = document.createElement('div');
        entryItem.className = 'entry-item';
        const entryText = document.createElement('div');
        entryText.className = 'entry-text';
        entryText.textContent = text;
        entryText.contentEditable = true; 
        entryText.dataset.originalValue = text; 

        entryText.addEventListener('blur', function(event) {
            const originalValue = event.target.dataset.originalValue;
            const newValue = event.target.textContent.trim();
            if (!newValue) {
                showNotification("Entry name cannot be empty!", "error");
                event.target.textContent = originalValue; 
                return;
            }
            if (newValue !== originalValue) {
                const isDuplicate = entries.some((entry, index) => 
                    entry === newValue && entries.indexOf(originalValue) !== index
                );
                if (isDuplicate) {
                    showNotification(`"${newValue}" is already in the wheel!`, "error");
                    event.target.textContent = originalValue; 
                    return;
                }
                const index = entries.indexOf(originalValue);
                if (index > -1) {
                    entries[index] = newValue;
                    event.target.dataset.originalValue = newValue; 
                    preRenderWheel(); // Re-render needed after edit
                    drawWheel(); 
                    showNotification(`Entry updated to "${newValue}"`, "success");
                } else {
                    showNotification("Error updating entry. Original not found.", "error");
                    event.target.textContent = originalValue; 
                }
            }
        });
        entryText.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); 
                event.target.blur(); 
            }
        });
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-entry';
        deleteButton.innerHTML = '&times;';
        deleteButton.addEventListener('click', function() {
            const currentValue = entryText.textContent.trim(); 
            const index = entries.indexOf(currentValue);
            if (index > -1) {
                entries.splice(index, 1);
                entriesList.removeChild(entryItem);
                preRenderWheel(); // Re-render needed after delete
                drawWheel();
            }
        });
        entryItem.appendChild(entryText);
        entryItem.appendChild(deleteButton);
        entriesList.appendChild(entryItem);
        entriesList.scrollTop = entriesList.scrollHeight;
        // --- DOM manipulation for the list --- END
        
        // Only draw immediately if specified (used for initial load)
        if (shouldDraw) {
             preRenderWheel(); // Re-render needed when adding individually and drawing
             drawWheel();
        }
    }
    
    // Pre-render the static wheel to the offscreen canvas
    function preRenderWheel() {
        // Ensure offscreen canvas matches main canvas size
        offscreenCanvas.width = canvas.width;
        offscreenCanvas.height = canvas.height;

        offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

        if (entries.length === 0) {
            wheelImageRendered = false;
            return; // Nothing to render
        }

        const centerX = offscreenCanvas.width / 2;
        const centerY = offscreenCanvas.height / 2;
        const radius = Math.min(centerX, centerY) * 0.9;

        // Draw segments and text onto offscreen canvas (NO rotation here)
        const arc = (2 * Math.PI) / entries.length;
        for (let i = 0; i < entries.length; i++) {
            const angle = i * arc; // Start angle based on index, no currentRotation
            
            // Draw segment fill
            offscreenCtx.beginPath();
            offscreenCtx.moveTo(centerX, centerY);
            offscreenCtx.arc(centerX, centerY, radius, angle, angle + arc);
            offscreenCtx.lineTo(centerX, centerY);
            offscreenCtx.fillStyle = wheelColors[i % wheelColors.length];
            offscreenCtx.fill();
            
            // Draw text
            offscreenCtx.save();
            offscreenCtx.translate(centerX, centerY);
            offscreenCtx.rotate(angle + arc / 2); // Rotate text relative to its segment
            
            const text = entries[i];
            offscreenCtx.fillStyle = textColor; 
            offscreenCtx.font = 'bold 16px Poppins, Arial'; 
            offscreenCtx.textAlign = 'right';
            offscreenCtx.textBaseline = 'middle';
            
            const textRadius = radius * 0.75; 
            if (text.length > 12) offscreenCtx.font = 'bold 14px Poppins, Arial';
            if (text.length > 20) offscreenCtx.font = 'bold 12px Poppins, Arial';
            
            offscreenCtx.fillText(text, textRadius, 0);
            offscreenCtx.restore();
        }

        // Draw the main wheel frame onto offscreen canvas
        offscreenCtx.beginPath();
        offscreenCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        offscreenCtx.lineWidth = 5; 
        offscreenCtx.strokeStyle = wheelFrameColor; 
        offscreenCtx.stroke();

        // Draw center circle onto offscreen canvas
        offscreenCtx.beginPath();
        offscreenCtx.arc(centerX, centerY, radius * 0.1, 0, 2 * Math.PI);
        offscreenCtx.fillStyle = wheelFrameColor; 
        offscreenCtx.fill();
        offscreenCtx.lineWidth = 2;
        offscreenCtx.strokeStyle = wheelFrameColor; 
        offscreenCtx.stroke();

        wheelImageRendered = true; // Mark as rendered
    }

    // Simplified main drawing function - draws the rotated pre-rendered image
    function drawWheel() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!wheelImageRendered || entries.length === 0) {
            // Optionally draw a placeholder if nothing is rendered/no entries
            ctx.fillStyle = '#555';
            ctx.font = '20px Poppins';
            ctx.textAlign = 'center';
            ctx.fillText("Add entries to spin!", canvas.width / 2, canvas.height / 2);
            return; // Don't draw the wheel image
        }

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(currentRotation);
        // Draw the pre-rendered canvas, centered
        ctx.drawImage(offscreenCanvas, -centerX, -centerY); 
        ctx.restore();
        
        // NOTE: The main wheel frame and center circle are now part of the 
        // pre-rendered image, so no need to draw them separately here.
    }
    
    function startSpin() {
        if (spinning) return;
        spinning = true;
        resultDisplay.textContent = '';
        
        spinTimeTotal = 30000;
        spinTime = 0;
        spinAngle = 0;
        
        const baseAngle = 2 * Math.PI * 20;
        const extraAngle = Math.random() * (2 * Math.PI * 10);
        spinAngle = baseAngle + extraAngle;
        
        rotateWheel();
    }
    
    function rotateWheel() {
        spinTime += 30;
        if (spinTime >= spinTimeTotal) {
            stopRotateWheel();
            return;
        }
        
        const currentSpinAngle = enhancedEaseOut(spinTime, 0, spinAngle, spinTimeTotal);
        currentRotation = currentSpinAngle;
        
        drawWheel();
        requestAnimationFrame(rotateWheel);
    }
     
    function enhancedEaseOut(t, b, c, d) {
        const time1 = 2000;
        const time3 = 7500;
        const time2 = d - time1 - time3;
        
        const totalAngle = c;
        
        const denominator = (time1 / 2) + time2 + (time3 / 2);
        const maxSpeed = totalAngle / denominator;
        const angle1 = maxSpeed * (time1 / 2);
        const angle2 = maxSpeed * time2;
        const angle3 = maxSpeed * (time3 / 2);
        
        if (t < time1) {
            const progress = t / time1;
            return b + angle1 * progress * progress;
        }
        else if (t < time1 + time2) {
            const progress = (t - time1) / time2;
            return b + angle1 + angle2 * progress;
        }
        else {
            const progress = (t - time1 - time2) / time3;
            return b + angle1 + angle2 + angle3 * (1 - Math.pow(1 - progress, 3));
        }
    }
    
    function stopRotateWheel() {
        spinning = false;
        
        const arc = (2 * Math.PI) / entries.length;
        const angleOffset = currentRotation % (2 * Math.PI);
        const selectorPosition = 3 * Math.PI / 2; // Selector at the top

        const effectiveAngle = (selectorPosition - angleOffset + 2 * Math.PI) % (2 * Math.PI);
        
        let selectedIndex = Math.floor(effectiveAngle / arc);
        
        selectedIndex = Math.max(0, Math.min(selectedIndex, entries.length - 1));
        
        const winner = entries[selectedIndex];
        
        resultDisplay.style.transform = 'scale(0.5)';
        resultDisplay.style.opacity = '0';
        
        setTimeout(() => {
            resultDisplay.textContent = `Winner: ${winner}`;
            resultDisplay.style.transform = 'scale(1)';
            resultDisplay.style.opacity = '1';
            
            showWinner(winner);
        }, 500);
    }
    
    function showWinner(winner) {
        winnerName.textContent = winner;
        
        setTimeout(() => {
            winnerModal.classList.add('active');
            
            startConfetti();
        }, 800);
    }
    
    function startConfetti() {
        const myConfetti = confetti.create(confettiCanvas, { 
            resize: true,
            useWorker: true
        });
        
        const end = Date.now() + 5000;
        
        const colors = ['#ff6b81', '#5f27cd', '#54a0ff', '#1dd1a1', '#feca57', '#ff9ff3'];
        
        (function frame() {
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
            
            myConfetti({
                particleCount: 6,
                angle: 130,
                spread: 100,
                origin: { x: 0.5, y: 0 },
                colors: colors
            });
            
            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
        
        myConfetti({
            particleCount: 150,
            spread: 120,
            origin: { y: 0.6 },
            colors: colors,
            gravity: 0.8
        });
    }
    
    // Initial wheel drawing is now handled by the initial addEntry calls
    // drawWheel(); // Remove this final one if it exists at the end
    
});