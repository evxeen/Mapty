'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);

    constructor(coords, distance, duration) {
        this.coords = coords; // [lat, lng]
        this.distance = distance; // in km
        this.duration = duration; // in min
    }
}

class Running extends Workout {
    type = 'running';

    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
    }

    calcPace() {
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}

class Cycling extends Workout {
    type = 'cycling';

    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        // this.type = 'cycling';
        this.calcSpeed();
    }

    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}

/////////////////////////////////////////////////////////////////////
//APPLICATION ARCHITECTURE
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
    #map;
    #mapEvent;
    #workouts = [];

    constructor(workouts, map) {
        this._getPosition();

        form.addEventListener('submit', this._newWorkout.bind(this));

        inputType.addEventListener('change', this._toggleElevationField);
    }

    _getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
                alert('Не удается получить ваше местоположение 😢');
            });
        }
    }

    _loadMap(position) {
        const {latitude} = position.coords;
        const {longitude} = position.coords;

        const coords = [latitude, longitude];

        this.#map = L.map('map').setView(coords, 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        this.#map.on('click', this._showForm.bind(this));
    }

    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }


    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _newWorkout(e) {
        const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));
        const allPositive = (...inputs) => inputs.every(inp => inp > 0);

        e.preventDefault();

        // оплучить данные с формы
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const {lat, lng} = this.#mapEvent.latlng;
        let workout;
        // если тренировка бега - создать объект бега
        if (type === 'running') {
            const cadence = +inputCadence.value;

            // проверить правильность данных
            if (!validInputs(duration, distance, cadence) || !allPositive(duration, distance, cadence))
                return alert('Значание дложно быть положительным числом');

            workout = new Running([lat, lng], distance, duration, cadence);
        }

        // если тренировка езды - создать объект езды
        if (type === 'cycling') {
            const elevation = +inputElevation.value;

            if (!validInputs(duration, distance, elevation) || !allPositive(duration, distance))
                return alert('Значание должно быть положительным числом');

            workout = new Cycling([lat, lng], distance, duration, elevation);
        }

        // добавить новый объект с тренировкой в массив
        this.#workouts.push(workout);
        console.log(workout);

        // отобразить тренировку на карте маркером
        this.renderWorkoutMarker(workout);

        // отобрать тренировку в списке тренировок

        // скрыть форму и отчистить поля
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
    }

    renderWorkoutMarker(workout) {
        L.marker(workout.coords).addTo(this.#map)
            .bindPopup(L.popup({
                maxWidth: 250,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`
            }))
            .setPopupContent('workout')
            .openPopup();
    }
}

const app = new App();

