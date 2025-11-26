/**
 * Model Selector Component
 * Handles model selection and applicability checking
 */

class ModelSelector {
    constructor() {
        this.API_BASE_URL = 'http://localhost:5000/api';
        this.modelSelect = document.getElementById('modelSelect');
        this.modelDescription = document.getElementById('modelDescription');
        this.applicabilityIndicator = document.getElementById('applicabilityIndicator');

        this.models = [];
        this.currentTicker = null;
        this.selectedModel = null;
        this.modelApplicability = {};

        this.init();
    }

    /**
     * Initialize the component
     */
    init() {
        // Listen for ticker selection
        document.addEventListener('ticker-selected', (e) => {
            this.handleTickerSelected(e.detail);
        });

        // Model select change event
        this.modelSelect.addEventListener('change', (e) => {
            this.handleModelChange(e);
        });

        // Hover for description
        this.modelSelect.addEventListener('mouseenter', () => {
            this.showDescription();
        });
    }

    /**
     * Handle ticker selection
     */
    async handleTickerSelected(detail) {
        const { ticker, data } = detail;
        this.currentTicker = ticker;
        this.stockData = data;

        // Load and display models
        await this.loadAndDisplayModels(ticker);
    }

    /**
     * Load and display models
     */
    async loadAndDisplayModels(ticker) {
        try {
            // Fetch models list
            const modelsResponse = await fetch(`${this.API_BASE_URL}/models/list`);
            if (!modelsResponse.ok) throw new Error('Failed to load models');

            const modelsData = await modelsResponse.json();
            this.models = modelsData.models || [];

            // Clear current options
            this.modelSelect.innerHTML = '<option value="">Select a model...</option>';

            // Check applicability for each model
            for (const model of this.models) {
                await this.checkApplicability(model.id, ticker);
            }

            // Populate select with models
            this.populateModelSelect();

        } catch (error) {
            console.error('Error loading models:', error);
            window.app?.showToast('Failed to load valuation models', 'error');
        }
    }

    /**
     * Check model applicability
     */
    async checkApplicability(modelId, ticker) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/models/check-applicability`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model_id: modelId,
                    ticker: ticker
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.modelApplicability[modelId] = data;
            } else {
                // Default if check fails
                this.modelApplicability[modelId] = {
                    applicable: true,
                    confidence: 0.8,
                    message: 'Model available'
                };
            }
        } catch (error) {
            console.error(`Error checking applicability for model ${modelId}:`, error);
            // Default if check fails
            this.modelApplicability[modelId] = {
                applicable: true,
                confidence: 0.8,
                message: 'Model available'
            };
        }
    }

    /**
     * Populate model select dropdown
     */
    populateModelSelect() {
        const currentValue = this.modelSelect.value;

        // Clear options except the first one
        while (this.modelSelect.children.length > 1) {
            this.modelSelect.removeChild(this.modelSelect.lastChild);
        }

        // Add models
        this.models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = model.name;

            const applicability = this.modelApplicability[model.id];
            if (applicability && !applicability.applicable) {
                option.disabled = true;
                option.textContent += ' (Not applicable)';
            }

            this.modelSelect.appendChild(option);
        });

        // Restore previous value if available
        if (currentValue) {
            this.modelSelect.value = currentValue;
        }

        // Update applicability indicator
        this.updateApplicabilityIndicator();
    }

    /**
     * Handle model change
     */
    async handleModelChange(e) {
        const modelId = e.target.value;

        if (!modelId) {
            this.selectedModel = null;
            this.modelDescription.classList.add('hidden');
            return;
        }

        this.selectedModel = modelId;
        const model = this.models.find(m => m.id === modelId);

        if (model) {
            // Show description
            this.showDescription(model);

            // Update applicability indicator
            this.updateApplicabilityIndicator();

            // Emit model selected event
            this.emitModelSelected(modelId, model.name);
        }
    }

    /**
     * Show model description
     */
    showDescription(model = null) {
        if (!model && this.selectedModel) {
            model = this.models.find(m => m.id === this.selectedModel);
        }

        if (model && model.description) {
            this.modelDescription.innerHTML = `
                <strong>${model.name}</strong><br>
                ${model.description}
            `;
            this.modelDescription.classList.remove('hidden');
        } else {
            this.modelDescription.classList.add('hidden');
        }
    }

    /**
     * Update applicability indicator
     */
    updateApplicabilityIndicator() {
        if (!this.selectedModel) {
            this.applicabilityIndicator.classList.remove('suitable', 'warning', 'unsuitable');
            this.applicabilityIndicator.textContent = '';
            this.applicabilityIndicator.title = 'Select a model to see applicability';
            return;
        }

        const applicability = this.modelApplicability[this.selectedModel];
        if (!applicability) {
            this.applicabilityIndicator.textContent = '?';
            this.applicabilityIndicator.title = 'Applicability unknown';
            return;
        }

        let icon, title, className;

        if (!applicability.applicable) {
            icon = '';
            title = 'Not recommended for this stock';
            className = 'unsuitable';
        } else if (applicability.confidence >= 0.8) {
            icon = '';
            title = 'Well-suited for this stock';
            className = 'suitable';
        } else if (applicability.confidence >= 0.5) {
            icon = ' ';
            title = 'Moderately suited for this stock';
            className = 'warning';
        } else {
            icon = '?';
            title = 'Applicability uncertain';
            className = 'warning';
        }

        this.applicabilityIndicator.textContent = icon;
        this.applicabilityIndicator.title = title;
        this.applicabilityIndicator.classList.remove('suitable', 'warning', 'unsuitable');
        this.applicabilityIndicator.classList.add(className);

        if (applicability.message) {
            this.applicabilityIndicator.title += ` - ${applicability.message}`;
        }
    }

    /**
     * Emit model-selected custom event
     */
    emitModelSelected(modelId, modelName) {
        const event = new CustomEvent('model-selected', {
            detail: {
                modelId,
                modelName
            }
        });
        document.dispatchEvent(event);
    }
}

// Initialize component when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.modelSelector = new ModelSelector();
});
