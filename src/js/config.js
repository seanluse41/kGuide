import { mount } from 'svelte';
import Config from '../Config.svelte';

const settings = document.querySelector('.settings');

if (!settings) {
  throw new Error('Required elements do not exist.');
}

mount(Config, { target: settings });
