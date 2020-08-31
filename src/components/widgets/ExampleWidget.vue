<template>
  <div class="example-widget">
    <h1>Example Widget</h1>
    <p>The set value for the example number is {{exampleSetting}}</p>
    <p>The set value for the example string is {{exampleTextSetting}}</p>
    <p>The set value for the example enum is {{exampleEnumSetting}}</p>
  </div>
</template>

<script>
  import {widgetSettings} from '@/widgetHelpers'
  export const widget = {
    name: "Example Widget",
    settings: {
      exampleSetting: {
        name: "Example Setting",
        type: "number",
        default: 3
      },
      exampleTextSetting: {
        name: "Text Setting",
        type: "string",
        default: "Default Value"
      },
      exampleEnumSetting: {
        name: "Example Enum",
        type: "enum",
        default: 'Option 1',
        enumerations: ['Option 1', {name: 'Option 2', value: 'option2'}]
      }
    }
  }

  export default {
    name: "ExampleWidget",
    props: {
      id: String
    },
    computed: {
      ...widgetSettings(Object.keys(widget.settings))
    }
  }
</script>

<style scoped>
  .example-widget {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 1rem;
  }
</style>
