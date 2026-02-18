---
layout: home
title: NJ Boardgames
---

<!-- GAMING / COUNTIES -->
<section id="gaming">
    <h2>Find Gaming Near You</h2>
    <p>Select your county to discover local boardgame groups, meetups, and events.</p>

    <div class="counties">
        {% for county in site.data.counties %}
        {% if county.active %}
        <a href="{{ county.slug | prepend: '/' | append: '/' | relative_url }}" class="county">{{ county.name }}</a>
        {% endif %}
        {% endfor %}
    </div>
</section>

<!-- ABOUT -->
<section id="about">
    <h2>About Us</h2>
    <p>
        NJ Boardgames is a community-driven hub for tabletop gamers across New Jersey.
        Our mission is to promote the modern tabletop boardgaming hobby by giving new
        and seasoned gamers an easy way to discover local in-person boardgame meet ups, clubs, etc.
        Whether you're into heavy euro, deckbuilding, social deduction, or party games,
        our goal is to connect players with local groups and events throughout the state.
        Due to its accessibility for new hobbyists, our emphasis is modern boardgames. However,
        the platform may still be used to promote niche gaming events within the scope of
        tabletop gaming.
    </p>
</section>

<!-- FOR ORGANIZERS -->
<section id="organizers">
    <h2>How It Works</h2>
    <p>
        If you would like us to promote your event(s) on our site, please fill out one of the google forms below.
        Once we approve your request, it will appear on the county page where your event is located.
        If your event includes board gaming, is free and open to the general public,
        and repeats regularly, we will feature it on the county page.
        <br><br>
        <a href="https://forms.gle/VJZVQHMRtHDHR1hm7">First Time Event Request</a> (Use if this is a new event, or anything other than date & time have changed since the last event)
        <br><br>
        <a href="https://forms.gle/tHR4oqyMbhEwxqoF7">Recurring Identical Events</a>
    </p>
</section>

<section id="allowed">
    <h2>What Events Are Allowed</h2>
    <ul>
        <li>In-person tabletop gaming</li>
        <li>Niche tabletop gaming (Chess, Magic, Warhammer, Pokemon, Scrabble, RPGs, etc.)</li>
        <li>Clubs requiring membership fees are ok, but the club must provide a way for new people to "try-it-out"</li>
        <li>Gaming conventions that include open/scheduled gaming</li>
        <li>Boardgame Design & Playtesting</li>
    </ul>
</section>

<section id="not-allowed">
    <h2>What Events Are NOT Allowed</h2>
    <ul>
        <li>Online boardgaming events</li>
        <li>Private events not open to the general public (i.e. in someone's home)</li>
        <li>Any events that require attendees to participate in (or sit through) anything
            other than gaming (i.e. a promotional presentation, religious service, etc.)</li>
        <li>Retail store sales, flea markets, garage sales, etc.</li>
    </ul>
</section>
