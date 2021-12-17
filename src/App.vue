/* eslint-disable no-eval */
/* eslint-disable no-eval */
<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-btn
        :disabled="navigateList.length === 0 && !selectedItem"
        text
        small
        @click="goBack"
      >
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-btn v-if="!editedItem && !selectedItem" text small @click="newItem">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
      <div v-if="!editedItem && !cutedItem && !copiedItem">
        <div v-if="selectedItem">
          <v-btn
            :disabled="selectedIndex() === 0"
            text
            small
            @click="moveItem(-1)"
          >
            <v-icon>mdi-arrow-up</v-icon>
          </v-btn>
          <v-btn
            :disabled="selectedIndex() + 1 === items().length"
            text
            small
            @click="moveItem(1)"
          >
            <v-icon>mdi-arrow-down</v-icon>
          </v-btn>
          <!-- Ändern -->
          <v-btn v-if="!selectedItem.deleted" text small @click="modifyItem">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <!-- Ausschneiden -->
          <v-btn v-if="!selectedItem.deleted" text small @click="cutItem">
            <v-icon>mdi-content-cut</v-icon>
          </v-btn>
          <v-btn v-if="selectedItem.deleted" text small @click="restoreItem">
            <v-icon>mdi-restore</v-icon>
          </v-btn>
          <!-- Löschen -->
          <v-btn text small @click="deleteItem">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </div>
      </div>
      <v-btn v-if="editedItem" text small @click="save">
        <v-icon>mdi-content-save</v-icon>
      </v-btn>
      <!-- Einfügen -->
      <v-btn v-if="cutedItem || copiedItem" text small @click="pasteItem">
        <v-icon>mdi-content-paste</v-icon>
      </v-btn>
      <v-spacer></v-spacer>

      <v-menu>
        <template v-slot:activator="{ on, attrs }">
          <v-btn icon v-bind="attrs" v-on="on">
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item
            v-if="!withDeletedItems"
            @click="withDeletedItems = true"
          >
            <v-list-item-title
              >Gelöschte Einträge mit anzeigen</v-list-item-title
            >
          </v-list-item>
          <v-list-item
            v-if="withDeletedItems"
            @click="withDeletedItems = false"
          >
            <v-list-item-title>Ohne gelöschte Einträge</v-list-item-title>
          </v-list-item>
          <v-list-item v-if="selectedItem" @click="copyItem">
            <v-list-item-title>Kopieren</v-list-item-title>
          </v-list-item>
          <v-list-item @click="download">
            <v-list-item-title>Daten-Download</v-list-item-title>
          </v-list-item>
          <v-list-item text small @click="onPickFile">
            <v-list-item-title>Daten-Upload</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <input
      type="file"
      style="display: none"
      ref="fileInput"
      accept="*.json"
      @change="onFilePicked"
    />

    <v-main class="ma-8">
      <div class="mb-2">
        <v-row v-if="!editedItem">
          <v-text-field v-model="searchText" label="Suche"></v-text-field>
          <v-btn v-if="searchText !== ''" text @click="searchItem">
            <v-icon>mdi-arrow-right</v-icon>
          </v-btn>
        </v-row>

        <v-row class="mb-2" v-if="currentItem">
          <div class="mr-1" @click="selectItem(null)">Home ></div>
          <div
            class="mr-1"
            v-for="item in pathArray(currentItem)"
            :key="item.id"
            @click="selectItem(item)"
          >
            {{ item.name + " >" }}
          </div>
        </v-row>

        <v-list>
          <div v-if="!(editedItem && editedItem.id)" class="mb-2">
            <h3>
              {{ currentItem ? showItem(currentItem) : "Home" }}
            </h3>
            <v-list-item-subtitle v-if="currentItem">{{
              new Date(currentItem.id).toLocaleString() +
              (currentItem.modified
                ? ", geändert: " +
                  new Date(currentItem.modified).toLocaleString()
                : "")
            }}</v-list-item-subtitle>
            <v-list-item-subtitle
              v-if="currentItem && currentItem.linkId"
              @click="selectItem(getItemById(currentItem.linkId))"
              >{{
                "Verknüpfung: " +
                pathString(getItemById(currentItem.linkId)) +
                showItem(getItemById(currentItem.linkId))
              }}</v-list-item-subtitle
            >
          </div>

          <div v-if="!editedItem">
            <v-list-item v-for="(item, i) in items()" :key="i">
              <v-list-item-content
                :class="item === selectedItem ? 'font-weight-bold' : ''"
              >
                <v-list-item-title
                  :class="item.deleted ? 'text-decoration-line-through' : ''"
                  v-text="
                    isNull(item.name) +
                    ' ' +
                    numberDe(
                      Math.round(resultEval(calculatedValue(item)) * 1000) /
                        1000
                    ) +
                    ' ' +
                    isNull(item.unit) +
                    (item.linkId
                      ? ' -> ' + showItem(getItemById(item.linkId))
                      : '')
                  "
                  @click="selectItem(item, true)"
                ></v-list-item-title>
                <v-list-item-subtitle
                  v-if="childrenString(item) !== ''"
                  @click="selectItem(item)"
                  >{{ childrenString(item) }}
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </div>

          <form v-if="editedItem" class="mt-4">
            <v-text-field
              ref="inputName"
              v-model="editedItem.name"
              label="Bezeichnung"
            ></v-text-field>
            <v-text-field
              v-model="numberEdit"
              label="Zahl oder Formel"
            ></v-text-field>
            <v-autocomplete
              v-model="editedItem.unit"
              :items="unitNames()"
              label="Einheit"
            ></v-autocomplete>
            <v-autocomplete
              v-model="editedItem.linkId"
              :items="
                myData.map((i) => {
                  return { id: i.id, name: pathString(i) };
                })
              "
              item-value="id"
              item-text="name"
              label="Verknüpfung"
            ></v-autocomplete>
          </form>
        </v-list>

        <v-list v-if="linkedItems().length > 0">
          <v-list-item-subtitle> Verwendungen </v-list-item-subtitle>
          <v-list-item
            v-for="(useItem, i) in linkedItems()"
            :key="i"
            @click="selectItem(getItemById(useItem.id))"
          >
            <v-list-item-content>
              <v-list-item-title
                v-text="pathString(useItem)"
              ></v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </div>
    </v-main>
  </v-app>
</template>

<script>

export default {
  name: 'App',

  data: () => ({
    myData: null,
    // items: null,
    withDeletedItems: false,
    selectedItem: null,
    currentItem: null,
    editedItem: null,
    cutedItem: null,
    copiedItem: null,
    downloaded: false,
    navigateList: [],
    searchText: '',
    searchTextOld: '',
    searchIndex: 0,
    units () {
      const units = [
        { name: '' },
        { name: 'Eur' },
        { name: 'St' },
        { name: 'kg' },
        { name: 'to', value: 1000, base: 'kg' },
        { name: 'mm' },
        { name: 'cm', value: 10, base: 'mm' },
        { name: 'm', value: 1000, base: 'mm' },
        { name: 'km', value: 1000 * 1000, base: 'mm' },
        { name: 'Min' },
        { name: 'Std', value: 60, base: 'Min' },
        { name: 'kWh' },
        { name: 'Tage', singular: 'Tag', value: 24 * 60, base: 'Min' },
        { name: 'Jahre', singular: 'Jahr', value: 24 * 60 * 365, base: 'Min' },
        { name: 'Los' },
        { name: '% Aufschlag' },
        { name: '% Anteil' }
      ]
      const unitsPer = []
      units.forEach((u1) => {
        if (!u1.name.includes('%') && u1.name !== '') {
          units.forEach((u2) => {
            if (
              u1 !== u2 &&
              !u2.name.includes('%') &&
              u2.name !== '' &&
              !(u1.unit && u1.unit === u2.name) &&
              !(u2.unit && u2.unit === u1.name)
            ) {
              const per = u2.singular ? u2.singular : u2.name
              unitsPer.push({ name: u1.name + '/' + per })
            }
          })
        }
      })
      return units.concat(unitsPer)
    }
  }),
  computed: {
    numberEdit: {
      get: function () {
        return this.numberDe(this.editedItem.value)
      },
      set: function (newValue) {
        this.editedItem.value = this.numberUs(newValue)
      }
    }
  },
  mounted () {
    if (localStorage.getItem('racalc-data') !== null) {
      this.myData = JSON.parse(localStorage.getItem('racalc-data'))
      this.myData = this.myData.filter((i) => !(i === null)) // Vermeidung von Fehlern, wenn leeres Objekt enthalten ist (4.12.21)
    } else {
      this.myData = []
    }
    // this.$refs.inputName.focus()

    this.$firestore.data.add({
      firstname: 'Amrani',
      lastname: 'Houssain'
    })
  },
  methods: {
    shownData () {
      if (this.withDeletedItems) {
        return this.myData
      } else {
        return this.myData.filter((i) => !i.deleted)
      }
    },
    items () {
      let items
      if (this.currentItem) {
        items = this.shownData().filter(
          (i) => i.parentId === this.currentItem.id
        )
      } else {
        items = this.shownData().filter((i) => !i.parentId)
      }
      return items
    },
    selectedIndex () {
      return this.items().indexOf(this.selectedItem)
    },
    calculatedValue (parentItem) {
      let calcValue = 0.0
      let multiplierUnit = null
      let multiplier1 = 1
      let multiplier2 = 1
      let divisorUnit = null
      let divisor = 1
      let percent = 100
      if (parentItem.unit && parentItem.unit.includes('/')) {
        // wenn Einheit z.B. Eur/st
        multiplierUnit = this.getUnitByName(parentItem.unit.split('/')[0])
        divisorUnit = this.getUnitByName(parentItem.unit.split('/')[1])
      }

      const items = this.shownData().filter(
        (i) => i.parentId === parentItem.id
      )

      if (items.length > 1) {
        if (
          items.filter(
            (i) => this.isNull(i.unit) === this.isNull(parentItem.unit)
          ).length === items.length
        ) {
          items.forEach(
            (i) => (calcValue += parseFloat(this.calculatedValue(i)))
          )
        } else {
          if (parentItem.unit) {
            items.forEach((item) => {
              if (item.linkId) {
                item = this.getItemById(item.linkId)
              }
              const unit = this.getUnitByName(item.unit)
              if (unit.name.includes('%')) {
                if (unit.name.includes('Aufschlag')) {
                  // eslint-disable-next-line no-eval
                  percent = eval(item.value) + 100
                } else {
                  percent = item.value
                }
              } else {
                // eslint-disable-next-line no-eval
                const value = eval(this.calculatedValue(item))
                if (parentItem.unit && parentItem.unit.includes('/')) {
                  if (unit.base.split('/')[0] === multiplierUnit.base) {
                    multiplier1 = value * unit.value
                  }
                  if (unit.base.split('/')[0] === divisorUnit.base) {
                    divisor = value * unit.value
                  }
                } else {
                  if (item.unit) {
                    if (!item.unit.includes('/')) {
                      multiplier1 = value * unit.value
                    }
                    if (item.unit.includes('/')) {
                      multiplier2 = value * unit.value
                    }
                  }
                }
              }
            })
            calcValue = (multiplier1 * multiplier2) / divisor
            calcValue =
              (calcValue / this.getUnitByName(parentItem.unit).value) *
              (percent / 100)
          }
        }
      }
      if (!calcValue) {
        calcValue = parentItem.value
      }

      return calcValue
    },
    searchItem () {
      if (this.searchText !== this.searchTextOld) {
        this.searchIndex = 0
      }
      const searchFilter = this.shownData().filter((i) => this.searchFound(i))
      if (searchFilter) {
        if (this.searchIndex === searchFilter.length) {
          this.searchIndex = 0
          alert('Ende erreicht.')
        }
        this.currentItem = searchFilter[this.searchIndex]
      } else {
        alert('Nicht gefunden.')
      }
      this.searchIndex += 1
      this.searchTextOld = this.searchText
    },
    searchFound (item) {
      let found = false
      this.searchText.split(' ').forEach((word) => {
        if (!found) {
          found =
            item.name && item.name.toUpperCase().includes(word.toUpperCase())
        }
      })
      this.searchText.split(' ').forEach((word) => {
        if (found) {
          found = this.pathString(item)
            .toUpperCase()
            .includes(word.toUpperCase())
        }
      })
      return found
    },
    unitNames () {
      return this.units().map((u) => u.name)
    },
    pathArray (item) {
      const array = []
      let count = 0
      while (count < 10 && item && item.parentId) {
        item = this.myData.find((i) => i.id === item.parentId)
        if (item) {
          array.unshift(item)
        }
        count += 1
      }
      return array
    },
    pathString (item) {
      let path = ''
      this.pathArray(item).forEach((i) => {
        if (path !== '') {
          path += ' > '
        }
        path += i.name
      })
      path += this.isNull(item.name)
      return path
    },
    childrenString (item) {
      let children = ''
      this.shownData()
        .filter((i) => i.parentId === item.id)
        .forEach((i) => {
          if (children !== '') {
            children += ', '
          }
          children += i.linkId
            ? ' -> ' + this.getItemById(i.linkId).name
            : this.isNull(i.name)
        })
      return children
    },
    linkedItems () {
      if (this.currentItem) {
        return this.myData.filter((i) => i.linkId === this.currentItem.id)
      } else {
        return []
      }
    },
    selectItem (item, fromList) {
      if (!fromList || (this.selectedItem && this.selectedItem === item)) {
        if (this.currentItem) {
          if (
            this.currentItem !== this.navigateList[this.navigateList.length - 1]
          ) {
            this.navigateList.push(this.currentItem)
          }
        } else {
          this.navigateList.push(null)
        }
        if (item && item.linkId && !item.name) {
          this.currentItem = this.getItemById(item.linkId)
        } else {
          this.currentItem = item
        }
        this.selectedItem = null
      } else {
        this.selectedItem = item
      }
    },
    getItemById (id) {
      return this.myData.find((i) => i.id === id)
    },
    showItem (item) {
      let value = this.isNull(this.calculatedValue(item))
      if (this.isNumeric(this.calculatedValue(item))) {
        value = this.numberDe(
          Math.round(this.calculatedValue(item) * 1000) / 1000
        )
      }
      return (
        this.isNull(item.name) + ' ' + value + ' ' + this.isNull(item.unit)
      )
    },
    goBack () {
      if (this.selectedItem || this.editedItem || this.cutedItem) {
        this.editedItem = null
        this.selectedItem = null
        this.cutedItem = null
      } else {
        const len = this.navigateList.length
        this.currentItem = this.navigateList[len - 1]
        this.navigateList.splice(len - 1, 1)
      }
    },
    newItem () {
      this.editedItem = {}
      if (this.currentItem) {
        const children = this.myData.filter(
          (i) => i.parentId === this.currentItem.id
        )
        if (this.currentItem) {
          this.editedItem.parentId = this.currentItem.id
        }
        if (this.currentItem.unit.includes('/')) {
          if (children.length === 0) {
            this.editedItem.unit = this.currentItem.unit.split('/')[0]
          } else {
            this.editedItem.unit = this.currentItem.unit.split('/')[1]
            if (this.units().find((u) => u.singular === this.editedItem.unit)) {
              this.editedItem.unit = this.units().find(
                (u) => u.singular === this.editedItem.unit
              ).name
            }
          }
        } else {
          if (
            children.length > 0 &&
            children[0].unit &&
            children[0].unit.includes('/')
          ) {
            // Wenn die erste Einheit z.B. "Eur/St" ist, dann als nächstes "St" vorschlagen
            this.editedItem.unit = children[0].unit.split('/')[1]
          } else {
            if (this.currentItem.unit) {
              this.editedItem.unit = this.currentItem.unit
            }
          }
        }
      }
    },
    modifyItem () {
      this.editedItem = { ...this.selectedItem }
    },
    moveItem (step) {
      const item = this.selectedItem
      const index = this.myData.indexOf(item)
      const nextItem = this.items()[this.selectedIndex() + step]
      this.myData.splice(index, 1)
      const nextIndex = this.myData.indexOf(nextItem)
      const endArray = this.myData.slice(nextIndex + (step === -1 ? 0 : 1))
      this.myData = this.myData.slice(0, nextIndex + (step === -1 ? 0 : 1))
      this.myData.push(item)
      this.myData = this.myData.concat(endArray)
      this.calculateAndStore()
    },
    cutItem () {
      this.cutedItem = { ...this.selectedItem }
      this.myData.splice(this.myData.indexOf(this.selectedItem), 1)
    },
    copyItem () {
      this.copiedItem = { ...this.selectedItem }
    },
    deleteItem () {
      if (!this.selectedItem.deleted) {
        this.selectedItem.deleted = true
      } else {
        this.myData.splice(this.myData.indexOf(this.selectedItem), 1)
      }
      this.calculateAndStore()
      this.selectedItem = null
    },
    restoreItem () {
      this.selectedItem.deleted = false
      this.calculateAndStore()
      this.selectedItem = null
    },
    pasteItem () {
      let item
      if (this.cutedItem) {
        item = this.cutedItem
      } else {
        item = this.copiedItem
      }
      if (this.currentItem) {
        item.parentId = this.currentItem.id
      } else {
        item.parentId = null
      }
      if (this.cutedItem) {
        this.cutedItem.modified = new Date()
        this.myData.push(this.cutedItem)
        this.cutedItem = null
      } else {
        pasteCopiedItem(this.copiedItem, this.myData)
        this.copiedItem = null
      }

      this.calculateAndStore()

      function pasteCopiedItem (item, data) {
        const oldId = item.id
        item.id = new Date()
        if (item.modified) {
          delete item.modified
        }
        data.push(item)
        const items = data.filter((i) => i.parentId === oldId)
        items.forEach((i) => {
          const child = { ...i }
          child.parentId = item.id
          pasteCopiedItem(child, data)
        })
      }
    },
    save () {
      this.editedItem.value = this.numberUs(this.editedItem.value)
      if (!this.editedItem.id) {
        this.editedItem.id = new Date()
        this.myData.push(this.editedItem)
      } else {
        // this.currentItem = {...this.editedItem}
        const item = this.myData.find((i) => i.id === this.editedItem.id)

        item.parentId = this.editedItem.parentId
        item.linkId = this.editedItem.linkId
        item.name = this.editedItem.name
        item.value = this.editedItem.value
        item.unit = this.editedItem.unit
        item.modified = new Date()
      }

      // this.calculateForParent(this.editedItem);
      // Alle neu kalkulieren
      this.calculateAndStore()

      this.editedItem = null
      this.cutedItem = null
      this.copiedItem = null
    },
    /*
    calculateForParent(item) {
      let count = 0;
      while (
        count < 10 &&
        item &&
        (item.value || item.linkId) &&
        item.parentId
      ) {
        let parentItem = this.myData.find((i) => i.id === item.parentId);
        if (parentItem) {
          parentItem.value = 0.0;
          let multiplierUnit = null;
          let multiplier1 = 1;
          let multiplier2 = 1;
          let divisorUnit = null;
          let divisor = 1;
          let percent = 100;
          if (parentItem.unit && parentItem.unit.includes("/")) {
            // wenn Einheit z.B. Eur/st
            multiplierUnit = this.getUnitByName(parentItem.unit.split("/")[0]);
            divisorUnit = this.getUnitByName(parentItem.unit.split("/")[1]);
          }

          let items = this.myData.filter((i) => i.parentId === item.parentId);

          if (items.length > 1) {
            if (
              items.filter(
                (i) => this.isNull(i.unit) === this.isNull(parentItem.unit)
              ).length === items.length
            ) {
              items.forEach((i) => (parentItem.value += parseFloat(i.value)));
            } else {
              if (parentItem.unit) {
                items.forEach((item) => {
                  if (item.linkId) {
                    item = this.getItemById(item.linkId);
                  }
                  let unit = this.getUnitByName(item.unit);
                  if (unit.name.includes("%")) {
                    if (unit.name.includes("Aufschlag")) {
                      percent = eval(item.value) + 100;
                    } else {
                      percent = item.value;
                    }
                  } else {
                    let value = eval(item.value);
                    if (parentItem.unit && parentItem.unit.includes("/")) {
                      if (unit.base.split("/")[0] === multiplierUnit.base) {
                        multiplier1 = value * unit.value;
                      }
                      if (unit.base.split("/")[0] === divisorUnit.base) {
                        divisor = value * unit.value;
                      }
                    } else {
                      if (item.unit) {
                        if (!item.unit.includes("/")) {
                          multiplier1 = value * unit.value;
                        }
                        if (item.unit.includes("/")) {
                          multiplier2 = value * unit.value;
                        }
                      }
                    }
                  }
                });
                parentItem.value = (multiplier1 * multiplier2) / divisor;
                parentItem.value =
                  (parentItem.value /
                    this.getUnitByName(parentItem.unit).value) *
                  (percent / 100);
              }
            }
          }
        }
        item = parentItem;
        count += 1;
      }
    }, */
    calculateAndStore () {
      /*
      this.myData.forEach((item) => {
        if (item.unit === "%") {
          item.unit = "% Aufschlag";
        }
      });
      this.myData.forEach((item) => {
        this.calculateForParent(item);
      }); */
      localStorage.setItem('racalc-data', JSON.stringify(this.myData))
    },
    download () {
      // credit: https://www.bitdegree.org/learn/javascript-download
      let text
      let filename
      if (this.currentItem) {
        const data = []
        data.push(this.currentItem)
        let item = this.currentItem
        let count = 0
        while (count < 10 && item.parentId) {
          item = this.myData.find((i) => i.id === item.parentId)
          data.push(item)
          count += 1
        }
        this.addChildrenToData(data, item)
        text = JSON.stringify(data)
        filename = 'racalc-' + this.currentItem.name + '.json'
      } else {
        text = JSON.stringify(this.myData)
        filename = 'racalc.json'
      }
      const element = document.createElement('a')
      element.setAttribute(
        'href',
        'data:application/json;charset=utf-8,' + encodeURIComponent(text)
      )
      element.setAttribute('download', filename)

      element.style.display = 'none'
      document.body.appendChild(element)

      element.click()
      document.body.removeChild(element)
    },
    addChildrenToData (data, item) {
      this.myData
        .filter((i) => i.parentId === item.id)
        .forEach((child) => {
          data.push(child)
          this.addChildrenToData(data, child)
        })
    },
    onPickFile () {
      this.$refs.fileInput.click()
    },
    // Upload
    onFilePicked (event) {
      this.download() // vorher sichern
      const files = event.target.files
      // let filename = files[0].name;
      const fileReader = new FileReader()
      fileReader.addEventListener('load', () => {
        this.imageUrl = fileReader.result
      })
      fileReader.readAsText(files[0])
      const thisHelp = this
      fileReader.onload = function () {
        const uploadData = JSON.parse(fileReader.result)
        uploadData.forEach((item) => {
          let foundItem = thisHelp.myData.find((i) => i.id === item.id)
          if (!foundItem) {
            thisHelp.myData.push(item)
          } else {
            if (
              foundItem.modified &&
              (!item.modified ||
                new Date(foundItem.modified) > new Date(item.modified))
            ) {
              foundItem = { ...item }
            }
          }
          localStorage.setItem('racalc-data', JSON.stringify(thisHelp.myData))
          window.location.reload()
        })
      }
    },
    getUnitByName (unitName) {
      let unit = null
      if (unitName) {
        unit = { name: unitName, base: null, value: 1 }
        unitName.split('/').forEach((name) => {
          let oneUnit = this.units().find((u) => u.name === name)
          if (!oneUnit) {
            oneUnit = this.units().find((u) => u.singular === name)
          }
          if (!unit.base) {
            if (oneUnit.base) {
              unit.base = oneUnit.base
              unit.value = oneUnit.value
            } else {
              unit.base = name
            }
          } else {
            if (oneUnit.base) {
              unit.base += '/' + oneUnit.base
              unit.value = unit.value / oneUnit.value
            } else {
              unit.base += '/' + name
            }
          }
        })
      }
      return unit
    },
    isNull (str) {
      if (str) {
        return str
      } else {
        return ''
      }
    },
    resultEval (str) {
      if (str) {
        try {
          // eslint-disable-next-line no-eval
          return eval(str)
        } catch (error) {
          return str
        }
      } else {
        return ''
      }
    },
    numberDe (value) {
      if (value) {
        return value.toString().replaceAll('.', ',')
      } else {
        return ''
      }
    },
    numberUs (value) {
      if (value) {
        return value.toString().replaceAll(',', '.')
      } else {
        return ''
      }
    },
    isNumeric (value) {
      return !isNaN(parseFloat(value)) && isFinite(value)
    }
  }
}
</script>
