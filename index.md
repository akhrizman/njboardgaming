---
layout: home
title: NJ Boardgames - New Jersey Board Game Meetups & Events
---

<!-- GAMING / COUNTIES -->
<section id="gaming">
    <h2>Find Gaming Near You</h2>
    <p>Select your county to discover local boardgame groups, meetups, and events.</p>

    <h3>New Jersey</h3>
    <div class="counties">
        {% for county in site.data.counties.nj %}
        {% if county.active %}
        <a href="{{ '/' | append: county.state | append: '/' | append: county.slug | append: '/' | relative_url }}" class="county">{{ county.name }}</a>
        {% endif %}
        {% endfor %}
    </div>

    <hr>
    <h3>Pennsylvania</h3>
    <div class="counties">
        {% for county in site.data.counties.pa %}
        {% if county.active %}
        <a href="{{ '/' | append: county.state | append: '/' | append: county.slug | append: '/' | relative_url }}" class="county">{{ county.name }}</a>
        {% endif %}
        {% endfor %}
    </div>

    <hr>
    <h3>New York</h3>
    <div class="counties">
        {% for county in site.data.counties.ny %}
        {% if county.active %}
        <a href="{{ '/' | append: county.state | append: '/' | append: county.slug | append: '/' | relative_url }}" class="county">{{ county.name }}</a>
        {% endif %}
        {% endfor %}
    </div>

    <hr>
    <h3>Delaware</h3>
    <div class="counties">
        {% for county in site.data.counties.de %}
        {% if county.active %}
        <a href="{{ '/' | append: county.state | append: '/' | append: county.slug | append: '/' | relative_url }}" class="county">{{ county.name }}</a>
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
        and seasoned gamers an easy way to discover local in-person boardgame meet ups and clubs.
        Whether you're into heavy euro, deckbuilding, social deduction, or party games,
        our goal is to connect players with local groups and events throughout the state.
        Due to its accessibility for new hobbyists, our emphasis is on modern boardgames. On the county pages, we will feature regularly occuring, general boardgaming events which are free and open to the general public. However,
        our platform may still be used to promote niche gaming events within the scope of tabletop gaming.
    </p>
</section>
