## The Engine Room

This folder does the heavy lifting of fetching and saving data. It handles the internet connection (remote) and the device's offline storage (local). It is managed by Repositories, which act as smart traffic cops: they decide whether to pull fresh data from the web API or load saved data from the local database.