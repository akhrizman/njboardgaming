const track = document.querySelector('.carousel-track');
const slides = Array.from(track.children);
const prevBtn = document.querySelector('.carousel-btn.prev');
const nextBtn = document.querySelector('.carousel-btn.next');

let index = 0;

function updateCarousel() {
	track.style.transform = `translateX(-${index * 100}%)`;
}

nextBtn.addEventListener('click', () => {
	index = (index + 1) % slides.length;
	updateCarousel();
});

prevBtn.addEventListener('click', () => {
	index = (index - 1 + slides.length) % slides.length;
	updateCarousel();
});

// Auto-play (optional)
setInterval(() => {
	index = (index + 1) % slides.length;
	updateCarousel();
}, 7000);
