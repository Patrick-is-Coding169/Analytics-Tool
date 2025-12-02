// SecureAnalytics Pro - Main JavaScript Application
class SecurityAnalytics {
    constructor() {
        this.data = {
            general: {
                objectName: 'Bürogebäude Maximilianstraße',
                location: 'Maximilianstraße 12, 80539 München',
                objectType: 'office',
                protectionClass: 'medium',
                employees: 450,
                operatingHours: 'Mo-Fr: 06:00-22:00'
            },
            environment: {
                political: 8,
                crime: 3,
                terror: 2,
                cyber: 6,
                emergency: 9,
                social: 1
            },
            object: {
                access: 7,
                cctv: 8,
                alarm: 6,
                fire: 9,
                building: 8,
                personnel: 5
            },
            analytics: {
                dataSources: {
                    verfassungsschutz: { status: 'active', lastUpdate: new Date() },
                    polizei: { status: 'synced', lastUpdate: new Date() },
                    twitter: { status: 'rate_limit', lastUpdate: new Date(Date.now() - 3600000) },
                    presseportal: { status: 'active', lastUpdate: new Date() },
                    weather: { status: 'live', lastUpdate: new Date() }
                }
            }
        };
        
        this.charts = {};
        this.autoUpdateInterval = null;
        this.currentSection = 'general';
        
        this.init();
    }

    // Initialisierung der Anwendung
    init() {
        this.setupEventListeners();
        this.initializeCharts();
        this.calculateRiskScores();
        this.startAutoUpdates();
        this.setupAnimations();
        this.loadFromStorage();
        
        console.log('🛡️ SecurityAnalytics Pro initialized successfully');
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Navigation Tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const section = e.target.getAttribute('onclick').match(/'([^']+)'/)[1];
                this.showSection(section);
            });
        });

        // Form Inputs
        document.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('change', () => this.saveToStorage());
        });

        // Range Sliders
        document.querySelectorAll('input[type="range"]').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const indicator = e.target.getAttribute('oninput').match(/'([^']+)'/)[1];
                this.updateIndicator(e.target.value, indicator);
            });
        });

        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case '1': this.showSection('general'); e.preventDefault(); break;
                    case '2': this.showSection('environment'); e.preventDefault(); break;
                    case '3': this.showSection('object'); e.preventDefault(); break;
                    case '4': this.showSection('analytics'); e.preventDefault(); break;
                    case 's': this.saveToStorage(); e.preventDefault(); break;
                    case 'e': this.exportData(); e.preventDefault(); break;
                }
            }
        });

        // Window Events
        window.addEventListener('resize', () => {
            this.resizeCharts();
        });

        window.addEventListener('beforeunload', () => {
            this.saveToStorage();
        });
    }

    // Navigation zwischen Sektionen
    showSection(sectionId) {
        // Aktuelle Sektion verstecken
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Neue Sektion anzeigen
        const targetSection = document.getElementById(sectionId);
        const targetTab = document.querySelector(`[onclick*="${sectionId}"]`);
        
        if (targetSection && targetTab) {
            targetSection.classList.add('active');
            targetTab.classList.add('active');
            this.currentSection = sectionId;
            
            // Chart Resize nach Section-Wechsel
            setTimeout(() => this.resizeCharts(), 300);
            
            // Analytics beim Wechsel
            this.trackSectionView(sectionId);
        }
    }

    // Indicator Updates
    updateIndicator(value, indicatorId) {
        const element = document.getElementById(indicatorId);
        if (element) {
            element.textContent = value;
            
            // Daten aktualisieren
            if (this.data.environment.hasOwnProperty(indicatorId)) {
                this.data.environment[indicatorId] = parseInt(value);
            } else if (this.data.object.hasOwnProperty(indicatorId)) {
                this.data.object[indicatorId] = parseInt(value);
            }
            
            // Berechnungen neu durchführen
            this.calculateRiskScores();
            this.updateCharts();
            this.saveToStorage();
            
            // Visual Feedback
            this.showUpdateFeedback(indicatorId);
        }
    }

    // Risiko-Berechnungen
    calculateRiskScores() {
        try {
            // Umfeldrisiko berechnen
            const envValues = Object.values(this.data.environment);
            const envScore = envValues.reduce((sum, val) => {
                // Negative Indikatoren invertieren (crime, terror, cyber)
                if (['crime', 'terror', 'cyber'].includes(Object.keys(this.data.environment)[envValues.indexOf(val)])) {
                    return sum + (10 - val);
                }
                return sum + val;
            }, 0) / envValues.length;

            // Objektrisiko berechnen
            const objValues = Object.values(this.data.object);
            const objScore = objValues.reduce((sum, val) => sum + val, 0) / objValues.length;

            // Gesamtrisiko
            const totalScore = (envScore + objScore) / 2;

            // UI Updates
            this.updateKPI('environmentRisk', (10 - envScore).toFixed(1), this.getRiskClass(10 - envScore));
            this.updateKPI('objectRisk', (10 - objScore).toFixed(1), this.getRiskClass(10 - objScore));
            this.updateKPI('totalRisk', (10 - totalScore).toFixed(1), this.getRiskClass(10 - totalScore));
            
            // Indikator Count
            const completedIndicators = this.getCompletedIndicatorsCount();
            this.updateKPI('indicatorCount', `${completedIndicators}/38`, '');
            
            // Progress Bars aktualisieren
            this.updateProgressBars();
            
        } catch (error) {
            console.error('Error calculating risk scores:', error);
            this.showNotification('Fehler bei der Risikoberechnung', 'error');
        }
    }

    // KPI Updates
    updateKPI(kpiId, value, riskClass) {
        const element = document.getElementById(kpiId);
        if (element) {
            // Alte Klassen entfernen
            element.className = element.className.replace(/risk-\w+/g, '');
            
            // Neue Werte setzen
            element.textContent = value;
            if (riskClass) {
                element.classList.add(riskClass);
            }
            
            // Animation
            element.style.transform = 'scale(1.1)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 200);
        }
    }

    // Risiko-Klassen bestimmen
    getRiskClass(score) {
        if (score <= 3) return 'risk-low';
        if (score <= 6) return 'risk-medium';
        return 'risk-high';
    }

    // Progress Bars aktualisieren
    updateProgressBars() {
        document.querySelectorAll('.progress-fill').forEach((bar, index) => {
            const kpiCard = bar.closest('.kpi-card');
            const value = kpiCard.querySelector('.kpi-value').textContent;
            
            let percentage;
            if (value.includes('/')) {
                const [current, total] = value.split('/');
                percentage = (parseInt(current) / parseInt(total)) * 100;
            } else {
                percentage = (parseFloat(value) / 10) * 100;
            }
            
            bar.style.width = `${Math.max(5, Math.min(100, percentage))}%`;
            
            // Farbe basierend auf Risiko
            if (percentage <= 30) {
                bar.style.background = 'linear-gradient(90deg, #00ff88, #00cc6a)';
            } else if (percentage <= 60) {
                bar.style.background = 'linear-gradient(90deg, #ffaa00, #ff8800)';
            } else {
                bar.style.background = 'linear-gradient(90deg, #ff4757, #ff3742)';
            }
        });
    }

    // Chart Initialisierung
    initializeCharts() {
        this.initEnvironmentChart();
        this.initObjectChart();
        this.initTrendChart();
    }

    // Umfeld-Radar-Chart
    initEnvironmentChart() {
        const ctx = document.getElementById('environmentChart');
        if (!ctx) return;

        this.charts.environment = new Chart(ctx.getContext('2d'), {
            type: 'radar',
            data: {
                labels: [
                    'Politische Stabilität',
                    'Kriminalitätsrate (invers)',
                    'Terrorrisiko (invers)',
                    'Cyber-Bedrohungen',
                    'Notfalldienste',
                    'Social Media'
                ],
                datasets: [{
                    label: 'Aktueller Stand',
                    data: [
                        this.data.environment.political,
                        10 - this.data.environment.crime,
                        10 - this.data.environment.terror,
                        10 - this.data.environment.cyber,
                        this.data.environment.emergency,
                        this.data.environment.social + 5
                    ],
                    backgroundColor: 'rgba(0, 212, 255, 0.2)',
                    borderColor: '#00d4ff',
                    pointBackgroundColor: '#00d4ff',
                    pointBorderColor: '#ffffff',
                    pointHoverBackgroundColor: '#ffffff',
                    pointHoverBorderColor: '#00d4ff',
                    borderWidth: 2,
                    pointRadius: 5
                }, {
                    label: 'Zielwerte',
                    data: [9, 8, 9, 8, 9, 7],
                    backgroundColor: 'rgba(0, 255, 136, 0.1)',
                    borderColor: '#00ff88',
                    pointBackgroundColor: '#00ff88',
                    pointBorderColor: '#ffffff',
                    borderWidth: 1,
                    pointRadius: 3,
                    borderDash: [5, 5]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 10,
                        ticks: {
                            color: '#b0b0b0',
                            backdropColor: 'transparent'
                        },
                        grid: {
                            color: '#333333'
                        },
                        angleLines: {
                            color: '#333333'
                        },
                        pointLabels: {
                            color: '#ffffff',
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }

    // Objekt-Bar-Chart
    initObjectChart() {
        const ctx = document.getElementById('objectChart');
        if (!ctx) return;

        this.charts.object = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: [
                    'Zugangs-\nkontrollen',
                    'Video-\nüberwachung',
                    'Alarm-\nsysteme',
                    'Brand-\nschutz',
                    'Bauliche\nSicherheit',
                    'Sicherheits-\npersonal'
                ],
                datasets: [{
                    label: 'Sicherheitsniveau',
                    data: Object.values(this.data.object),
                    backgroundColor: Object.values(this.data.object).map(val => {
                        if (val >= 8) return '#00ff88';
                        if (val >= 6) return '#ffaa00';
                        return '#ff4757';
                    }),
                    borderColor: '#00d4ff',
                    borderWidth: 1,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#00d4ff',
                        bodyColor: '#ffffff',
                        borderColor: '#00d4ff',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        ticks: {
                            color: '#b0b0b0'
                        },
                        grid: {
                            color: '#333333'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#b0b0b0',
                            maxRotation: 0
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Trend-Linien-Chart
    initTrendChart() {
        const ctx = document.getElementById('trendChart');
        if (!ctx) return;

        const last6Months = this.generateTrendData();

        this.charts.trend = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun'],
                datasets: [{
                    label: 'Gesamtrisiko',
                    data: last6Months.totalRisk,
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 6,
                    pointBackgroundColor: '#00d4ff',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2
                }, {
                    label: 'Cyber-Bedrohungen',
                    data: last6Months.cyberThreats,
                    borderColor: '#ff4757',
                    backgroundColor: 'rgba(255, 71, 87, 0.1)',
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointBackgroundColor: '#ff4757',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2
                }, {
                    label: 'Umfeldstabilität',
                    data: last6Months.environmentStability,
                    borderColor: '#00ff88',
                    backgroundColor: 'rgba(0, 255, 136, 0.1)',
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointBackgroundColor: '#00ff88',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff',
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#00d4ff',
                        bodyColor: '#ffffff',
                        borderColor: '#00d4ff',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        ticks: {
                            color: '#b0b0b0'
                        },
                        grid: {
                            color: '#333333'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#b0b0b0'
                        },
                        grid: {
                            color: '#333333'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    // Charts aktualisieren
    updateCharts() {
        if (this.charts.environment) {
            this.charts.environment.data.datasets[0].data = [
                this.data.environment.political,
                10 - this.data.environment.crime,
                10 - this.data.environment.terror,
                10 - this.data.environment.cyber,
                this.data.environment.emergency,
                this.data.environment.social + 5
            ];
            this.charts.environment.update('none');
        }

        if (this.charts.object) {
            const values = Object.values(this.data.object);
            this.charts.object.data.datasets[0].data = values;
            this.charts.object.data.datasets[0].backgroundColor = values.map(val => {
                if (val >= 8) return '#00ff88';
                if (val >= 6) return '#ffaa00';
                return '#ff4757';
            });
            this.charts.object.update('none');
        }
    }

    // Chart Resize
    resizeCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }

    // Trend-Daten generieren
    generateTrendData() {
        return {
            totalRisk: [4.5, 4.3, 4.1, 4.2, 4.0, 4.2],
            cyberThreats: [5.2, 5.5, 6.1, 6.3, 6.0, 6.4],
            environmentStability: [7.8, 7.6, 7.9, 8.1, 7.8, 8.0]
        };
    }

    // Auto-Updates starten
    startAutoUpdates() {
        // Simulierte Live-Updates alle 10 Sekunden
        this.autoUpdateInterval = setInterval(() => {
            this.simulateLiveUpdates();
        }, 10000);

        // Datenquellen-Status Updates
        setInterval(() => {
            this.updateDataSourceStatus();
        }, 30000);
    }

    // Live-Updates simulieren
    simulateLiveUpdates() {
        const indicators = Object.keys(this.data.environment);
        const randomIndicator = indicators[Math.floor(Math.random() * indicators.length)];
        
        const currentValue = this.data.environment[randomIndicator];
        const change = (Math.random() -
