<template>
  <v-container>
    <v-text-field
      ref="refSearchInput"
      v-model="searchText"
      label="Suche">
    </v-text-field>
  </v-container>
</template>

<script>
export default {
  mounted () {
    this.$refs.refSearchInput.focus()
  }
}
</script>
