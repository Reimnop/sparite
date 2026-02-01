<script lang="ts">
  import "./layout.css";
  import favicon from "$lib/assets/favicon.png";
  import { ModeWatcher } from "mode-watcher";

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap" rel="stylesheet">

  <title>Sparite</title>
  <meta name="title" content="Sparite" />
	<meta name="description" content="Turn your pixel art into Project Arrhythmia prefabs!" />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://sparite.reimnop.com/" />
	<meta property="og:title" content="Sparite" />
	<meta property="og:description" content="Turn your pixel art into Project Arrhythmia prefabs!" />

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content="https://sparite.reimnop.com/" />
	<meta property="twitter:title" content="Sparite" />
	<meta property="twitter:description" content="Turn your pixel art into Project Arrhythmia prefabs!" />
</svelte:head>

<ModeWatcher />
{@render children()}
