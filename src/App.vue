/* eslint-disable no-eval */
/* eslint-disable no-eval */
<template>
  <v-app>
    <v-snackbar bottom right :value="updateExists" :timeout="0" color="primary">
      Es ist ein Update verfügbar
      <v-btn text @click="refreshApp">Update</v-btn>
    </v-snackbar>
    <v-app-bar app color="primary" dark>
      <v-btn
        :disabled="navigateList.length === 0 && !selectedItem  && !editedItem"
        text
        small
        @click="goBack"
      >
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-btn v-if="!editedItem && !selectedItem" text small @click="setNewItem">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
      <v-btn v-if="editedItem" text small @click="save(editedItem)">
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
          <v-list-item v-if="!withDeletedItems" @click="withDeletedItems = true">
            <v-list-item-title>Gelöschte Einträge mit anzeigen</v-list-item-title>
          </v-list-item>
          <v-list-item v-if="withDeletedItems" @click="withDeletedItems = false">
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
          <v-list-item v-if="currentItem" text small>
            <v-list-item-title>{{ 'ID: ' + currentItem.id }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <input
      type="file"
      style="display: none"
      ref="fileInput"
      accept="*.json"
      @change="getUploadetData"
    />

    <v-main class="ma-8">
      <div class="mb-2">
        <v-row>
          <v-text-field v-model="searchText" label="Suche" @keydown="searchInputKeydown"></v-text-field>
          <v-btn text @click="searchItem">
            <v-icon>mdi-arrow-right</v-icon>
          </v-btn>
        </v-row>

        <!-- Pfad -->
        <v-row class="mb-2" v-if="currentItem">
          <div class="mr-1" @click="selectItem(null)">Home ></div>
          <div
            class="mr-1"
            v-for="item in pathArray(currentItem)"
            :key="item.id"
            @click="selectItem(item)"
          >{{ item.name + " >" }}</div>
        </v-row>

        <v-list>
          <v-list-item-group
            v-model="selIndex"
            color="primary"
          >
            <div v-if="!(editedItem && editedItem.id)" class="mb-2">
              <h3>{{ currentItem ? showItem(currentItem) : "Home" }}</h3>
              <v-list-item-subtitle
                v-if="currentItem && currentItem.timeStamp"
              >
                {{
                  getDate(currentItem.timeStamp).toLocaleDateString() + (currentItem.user ? ' ' + currentItem.user : '')
                  + (currentItem.date ? ', Termin: ' + new Date(currentItem.date).toLocaleDateString() + ' ' + this.isNull(currentItem.responsible) : '')
                }}
              </v-list-item-subtitle>
              <v-list-item-subtitle
                v-if="currentItem && currentItem.linkId"
                @click="selectItem(getItemById(currentItem.linkId))"
              >
                {{
                "Verknüpfung: " +
                pathString(getItemById(currentItem.linkId))
                }}
              </v-list-item-subtitle>
            </div>

            <div v-if="!editedItem">

              <!-- Terminliste -->
              <v-list v-if="dateList().length > 0">
                <v-list-group
                >
                  <template v-slot:activator>
                    <v-list-item-title>📅 Termine</v-list-item-title>
                  </template>
                  <v-list-item v-for="(item, i) in dateList()" :key="i">
                    <v-list-item-icon/>
                    <v-list-item-content  @click="selectItem(item)">
                      <v-list-item-title>
                        {{ new Date(item.date).toLocaleDateString() }}
                      </v-list-item-title>
                      <v-list-item-subtitle>
                        {{ pathString(item) }}
                      </v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>
                </v-list-group>
              </v-list>

              <v-list-item v-for="(item, i) in currentItems()" :key="i">
                <v-list-item-content :class="item.unread ? 'font-weight-bold' : ''">
                  <div
                    color="primary"
                    :class="item.deleted ? 'text-decoration-line-through' : ''"
                    v-text="
                      (item.toCloud ? '☁️ ' : '') +
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
                    @click="selectItem(item)"
                  ></div>
                  <v-list-item-subtitle
                    v-if="childrenString(item) !== ''"
                    @click="selectItem(item)"
                  >{{ childrenString(item) }}</v-list-item-subtitle>
                </v-list-item-content>

                <!-- Löschen -->
                <v-list-item-action>
                  <v-icon small @click="deleteItem(item)">mdi-delete</v-icon>
                </v-list-item-action>

                <v-list-item-action>
                  <v-menu>
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn icon v-bind="attrs" v-on="on">
                        <v-icon>mdi-dots-vertical</v-icon>
                      </v-btn>
                    </template>
                    <v-list>
                      <v-list-item>
                        <v-icon small @click="moveItemUp(item)">mdi-arrow-up</v-icon>
                      </v-list-item>
                      <v-list-item>
                        <v-icon small @click="moveItemDown(item)">mdi-arrow-down</v-icon>
                      </v-list-item>
                      <v-list-item v-if="!item.deleted">
                        <v-icon small @click="cutItem(item)">mdi-content-cut</v-icon>
                      </v-list-item>
                      <v-list-item v-if="!item.deleted">
                        <v-icon small @click="modifyItem(item)">mdi-pencil</v-icon>
                      </v-list-item>
                      <v-list-item v-if="item.deleted">
                        <v-icon small @click="restoreItem(item)">mdi-restore</v-icon>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </v-list-item-action>
              </v-list-item>

              <v-list-item>
                <v-list-item-content>
                  <v-text-field v-model="newItemName" label="Neuer Eintrag" @keydown="newItemNameKeydown"></v-text-field>
                </v-list-item-content>
                <v-list-item-action>
                  <v-btn icon>
                    <v-icon small @click="saveNewItemName">mdi-content-save</v-icon>
                  </v-btn>
                </v-list-item-action>
              </v-list-item>
            </div>

            <v-form v-if="editedItem" class="mt-4">
              <v-text-field v-model="userName" label="Benutzername"></v-text-field>
              <v-textarea v-model="editedItem.name" label="Inhalt" autofocus rows="3"></v-textarea>
              <v-text-field v-model="numberEdit" label="Zahl oder Ausdruck (z.B. 1,5 * 3)" @keydown="editFormKeydown"></v-text-field>
              <v-autocomplete v-model="editedItem.unit" :items="unitNames()" label="Einheit"></v-autocomplete>
              <v-text-field
                v-model="editedItem.date"
                hide-details
                label="Termin"
                type="date"
              />
              <v-text-field
                v-model="editedItem.responsible"
                label="Zuständig"
              />
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
              <v-checkbox v-if="!itemHasChildrenInCloud(editedItem)" v-model="editedItem.toCloud" label="In Cloud speichern"></v-checkbox>
              <v-checkbox v-if="editedItem.toCloud" v-model="sendNotification" label="Andere benachrichtigen"></v-checkbox>
            </v-form>
          </v-list-item-group>
        </v-list>

        <v-list v-if="linkedItems().length > 0">
          <v-list-item-subtitle>Verwendungen</v-list-item-subtitle>
          <v-list-item
            v-for="(useItem, i) in linkedItems()"
            :key="i"
            @click="selectItem(getItemById(useItem.id))"
          >
            <v-list-item-content>
              <v-list-item-title v-text="pathString(useItem)"></v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </div>
    </v-main>
  </v-app>
</template>

<script>
import firebase from 'firebase'

export default {
  name: 'App',

  data: () => ({
    registration: null,
    updateExists: false,
    myData: [],
    cloudItems: null,
    // items: null,
    withDeletedItems: false,
    selectedItem: null,
    selIndex: null,
    currentItem: null,
    newItemName: '',
    editedItem: null,
    userName: '',
    sendNotification: false,
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
        { name: 'ct', value: 0.01, base: 'Eur' },
        { name: 'St' },
        { name: 'kg' },
        { name: 'to', value: 1000, base: 'kg' },
        { name: 'mm' },
        { name: 'cm', value: 10, base: 'mm' },
        { name: 'm', value: 1000, base: 'mm' },
        { name: 'km', value: 1000 * 1000, base: 'mm' },
        { name: 'l' },
        { name: 'm³', value: 1000, base: 'l' },
        { name: 'Min' },
        { name: 'Std', value: 60, base: 'Min' },
        { name: 'Tage', singular: 'Tag', value: 24 * 60, base: 'Min' },
        { name: 'Monate', singular: 'Monat', value: 24 * 60 * 365 / 12, base: 'Min' },
        { name: 'Jahre', singular: 'Jahr', value: 24 * 60 * 365, base: 'Min' },
        { name: 'kWh' },
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
  created () {
    document.addEventListener('swUpdated', this.updateAvailable, { once: true })
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // We'll also need to add 'refreshing' to our data originally set to false.
      if (this.refreshing) return
      this.refreshing = true
      // Here the actual reload of the page occurs
      window.location.reload()
    })
  },
  mounted () {
    if (localStorage.getItem('myinfo24-data') !== null) {
      this.myData = JSON.parse(localStorage.getItem('myinfo24-data'))
      this.myData = this.myData.filter((i) => !(i === null)) // Vermeidung von Fehlern, wenn leeres Objekt enthalten ist (4.12.21)
    } else {
      this.myData = []
    }
    if (localStorage.getItem('myinfo24-userName') !== null) {
      this.userName = localStorage.getItem('myinfo24-userName')
      if (this.userName === null) {
        this.userName = ''
      }
    }

    this.getFromFirestore()

    this.setPosToItems(null)
  },
  methods: {
    shownData () {
      if (this.withDeletedItems) {
        return this.myData
      } else {
        return this.myData.filter((i) => !i.deleted || i.unread)
      }
    },
    currentItems () {
      let items
      if (this.currentItem) {
        items = this.shownData().filter(
          (i) => i.parentId === this.currentItem.id
        )
      } else {
        items = this.shownData().filter((i) => !i.parentId)
      }
      return items.sort((a, b) => a.pos - b.pos)
    },
    // Terminliste
    dateList () {
      return this.shownData().filter((i) => i.date && (!i.responsible || i.responsible === this.userName) &&
        (!this.currentItem || this.pathArray(i).find(p => p.id === this.currentItem.id)))
        .sort((a, b) => this.getDate(a.date) - this.getDate(b.date))
    },
    selectedIndex () {
      return this.currentItems().indexOf(this.selectedItem)
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
        multiplierUnit = this.getUnitByName(this.baseUnit(parentItem.unit).split('/')[0])
        divisorUnit = this.getUnitByName(this.baseUnit(parentItem.unit).split('/')[1])
      }

      const items = this.shownData().filter(
        (i) => i.parentId === parentItem.id
      )

      if (items.length >= 1) {
        if (
          items.filter(
            (i) => this.baseUnit(i.unit) === this.baseUnit(parentItem.unit)
          ).length === items.length
        ) {
          items.forEach(
            (i) => (calcValue += parseFloat(this.baseValue(i.unit, this.calculatedValue(i))))
          )
        } else {
          if (parentItem.unit) {
            items.forEach((item) => {
              if (item.linkId) {
                item = this.getItemById(item.linkId)
              }
              if (item && item.unit) {
                const unit = this.getUnitByName(this.baseUnit(item.unit))
                if (unit.name.includes('%')) {
                  if (unit.name.includes('Aufschlag')) {
                  // eslint-disable-next-line no-eval
                    percent = eval(item.value) + 100
                  } else {
                    percent = item.value
                  }
                } else {
                // eslint-disable-next-line no-eval
                  const value = this.baseValue(item.unit, eval(this.calculatedValue(item)))
                  if (parentItem.unit && parentItem.unit.includes('/')) {
                    if (unit.base.split('/')[0] === multiplierUnit.name) {
                      multiplier1 = value // * unit.value
                    }
                    if (unit.base.includes('/') && unit.base.split('/')[1] === divisorUnit.name) {
                      multiplier2 = value
                    } else {
                      if (unit.base.split('/')[0] === divisorUnit.name) {
                        divisor = value // * unit.value
                      }
                    }
                  } else {
                    if (item.unit) {
                      if (!item.unit.includes('/')) {
                        multiplier1 = value // * unit.value
                      }
                      if (item.unit.includes('/')) {
                        multiplier2 = value // * unit.value
                      }
                    }
                  }
                }
              }
            })
            calcValue = (multiplier1 * multiplier2) / divisor
            calcValue = calcValue * (percent / 100)
            /*
            calcValue =
              (calcValue / this.getUnitByName(parentItem.unit).value) *
              (percent / 100)
            */
          }
        }
      }
      if (!calcValue) {
        calcValue = parentItem.value
      } else {
        calcValue = this.originValue(parentItem.unit, calcValue)
      }

      return calcValue
    },
    baseUnit (unit) {
      let result = ''
      if (unit) {
        unit.split('/').forEach(u => {
          if (result !== '') {
            result += '/'
          }
          if (this.getUnitByName(u).base) {
            result += this.getUnitByName(u).base
          } else {
            result += u
          }
        })
      }
      return result
    },
    baseValue (unit, value) {
      if (unit) {
        let result
        unit.split('/').forEach(u => {
          const unitValue = this.getUnitByName(u).value ? this.getUnitByName(u).value : 1
          if (!result) {
            result = value * unitValue
          } else {
            result = result / unitValue
          }
        })
        return result
      } else {
        return value
      }
    },
    originValue (unit, baseValue) {
      if (unit) {
        let value
        unit.split('/').forEach(u => {
          const unitValue = this.getUnitByName(u).value ? this.getUnitByName(u).value : 1
          if (!value) {
            value = baseValue / unitValue
          } else {
            value = value * unitValue
          }
        })
        return value
      } else {
        return baseValue
      }
    },
    displayNotification (msg) {
      Notification.requestPermission(function (status) {
        console.log('Notification permission status:', status)
      })
      if (Notification.permission === 'granted') {
        /*
        navigator.addEventListener('explore', function () {
          window.open('https://www.myinfo24.web.app')
        })
        */
        navigator.serviceWorker.getRegistration()
          .then(function (reg) {
            if (reg === undefined) {
              console.log('only works online')
              return
            }
            var options = {
              body: msg,
              icon: './static/img/notification-flat.png',
              vibrate: [100, 50, 100],
              data: {
                dateOfArrival: Date.now(),
                primaryKey: 1
              },
              actions: [
                {
                  action: 'explore',
                  title: 'App öffnen',
                  icon: './static/img/checkmark.png'
                },
                {
                  action: 'close',
                  title: 'Schließen',
                  icon: './static/img/xmark.png'
                }
              ]
            }
            reg.showNotification('myinfo24', options)
          })
      }
    },
    setPosToItems (parent) {
      let items
      if (parent) {
        items = this.myData.filter(
          (i) => i.parentId === parent.id
        )
      } else {
        items = this.myData.filter((i) => !i.parentId)
      }
      for (let index = 0; index < items.length; index++) {
        if (!items[index].pos) {
          items[index].pos = index + 1
          this.save(items[index])
          this.setPosToItems(items[index])
        }
      }
    },
    updateAvailable (event) {
      this.registration = event.detail
      this.updateExists = true
    },
    refreshApp () {
      this.updateExists = false
      // Make sure we only send a 'skip waiting' message if the SW is waiting
      if (!this.registration || !this.registration.waiting) return
      // Send message to SW to skip the waiting and activate the new SW
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    },
    async getFromFirestore () {
      var dataRef = await firebase
        .firestore()
        .collection('data')

      dataRef.onSnapshot(snap => {
        this.cloudItems = []
        snap.forEach(doc => {
          const item = doc.data()
          item.id = doc.id
          this.cloudItems.push(item)
        })
        this.myData.filter(i => i.toCloud).forEach(item => {
          const cloudItem = this.cloudItems.find(i => item.id === i.id)
          if (cloudItem) {
            this.setCloudItemToMydata(cloudItem)
          }
        })

        // Hilfe hinzufügen
        const helpItem = this.cloudItems.find(i => i.id === '2021-11-16T18:27:35.008Z')
        this.itemTreeToMyData(helpItem)

        if (this.$route.query.id) {
          const cloudItem = this.cloudItems.find(i => this.searchText.substring(4) === this.$route.query.id)
          if (cloudItem) {
            this.setCloudItemToMydata(cloudItem)
            this.storeData()
          }
          this.currentItem = this.getItemById(this.$route.query.id)
        }
      })
    },
    itemTreeToMyData (item) {
      item.toCloud = true
      this.setItemToMyData(item, false)
      this.cloudItems
        .filter((i) => i.parentId === item.id)
        .forEach((child) => {
          this.itemTreeToMyData(child)
        })
    },
    itemHasChildrenInCloud (item) {
      return item.id ? this.cloudItems.find(i => i.parentId === item.id) : null
    },
    searchInputKeydown (e) {
      if (e.code === 'Enter') {
        this.searchItem()
      }
    },
    searchItem () {
      if (this.searchText.substring(0, 4) === 'ID: ') {
        const cloudItem = this.cloudItems.find(i => this.searchText.substring(4) === i.id)
        if (cloudItem) {
          this.searchText = ''

          this.setCloudItemToMydata(cloudItem)

          this.storeData()
        }
      } else {
        if (this.searchText !== this.searchTextOld) {
          this.searchIndex = 0
        }
        const searchFilter = this.shownData().filter((i) => this.searchFound(i)).sort((a, b) => this.getDate(b.timeStamp) - this.getDate(a.timeStamp))
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
      }
    },
    searchFound (item) {
      let found = false
      if (this.searchText === '') {
        found = true
      } else {
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
      }
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
        path += i.name
        path += ' > '
      })
      path += this.isNull(item.name)
      return path
    },
    childrenString (item) {
      let children = ''
      this.shownData()
        .filter((i) => i.parentId === item.id).sort((a, b) => a.pos - b.pos)
        .forEach((i) => {
          if (children !== '') {
            children += ', '
          }
          if (i.linkId && this.getItemById(i.linkId)) {
            children += this.isNull(this.getItemById(i.linkId).name)
          } else {
            children += this.isNull(i.name)
          }
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
    selectItem (item) {
      if (this.currentItem) {
        if (
          this.currentItem !== this.navigateList[this.navigateList.length - 1]
        ) {
          this.navigateList.push(this.currentItem)
        }
      } else {
        this.navigateList.push(null)
      }
      this.currentItem = item
      if (item && item.unread) {
        delete item.unread
        this.storeData()
      }
      this.searchText = ''
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
      this.selIndex = null
      this.newItemName = ''
    },
    setNewItem () {
      this.editedItem = {}
      if (this.currentItem) {
        if (this.currentItem.toCloud) {
          // Cloud-Vorschlag aus Oberpunkt
          this.editedItem.toCloud = true
        }
        const children = this.myData.filter(
          (i) => i.parentId === this.currentItem.id
        )
        if (this.currentItem) {
          this.editedItem.parentId = this.currentItem.id
        }
        if (this.currentItem.unit && this.currentItem.unit.includes('/')) {
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
    saveNewItemName () {
      this.setNewItem()
      this.editedItem.name = this.newItemName
      this.newItemName = ''
      this.save(this.editedItem)
    },
    modifyItem (item) {
      this.editedItem = { ...item }
    },
    moveItemUp (item) {
      this.selectedItem = item
      const posBefore = this.currentItems()[this.selectedIndex() - 1].pos
      let posBeforeBefore = 0
      if (this.selectedIndex() > 1) {
        posBeforeBefore = this.currentItems()[this.selectedIndex() - 2].pos
      }
      this.selectedItem.pos = posBeforeBefore + (posBefore - posBeforeBefore) / 2
      this.save(this.selectedItem)

      // Damit nach einem neuen Eintrag die Anzeige aktualisiert wird
      this.resetSelectedItem()
      this.selIndex -= 1
    },
    moveItemDown (item) {
      this.selectedItem = item
      const posNext = this.currentItems()[this.selectedIndex() + 1].pos
      if (this.selectedIndex() + 2 === this.currentItems().length) {
        this.selectedItem.pos = posNext + 1
      } else {
        const posNextNext = this.currentItems()[this.selectedIndex() + 2].pos
        this.selectedItem.pos = posNext + (posNextNext - posNext) / 2
      }
      this.save(this.selectedItem)
      this.resetSelectedItem()
      this.selIndex += 1
    },
    cutItem (item) {
      this.cutedItem = { ...item }
      this.myData.splice(this.myData.indexOf(item), 1)
    },
    copyItem () {
      this.copiedItem = { ...this.currentItem }
    },
    deleteItem (item) {
      if (item.toCloud && !item.parentId) {
        this.myData.splice(this.myData.indexOf(item), 1)
        this.storeData()
      } else {
        item.deleted = true
        this.save(item)
      }
    },
    restoreItem (item) {
      item.deleted = false
      this.save(item)
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
        // this.cutedItem.timeStamp = new Date()
        this.myData.push(this.cutedItem)
        this.save(this.cutedItem)
      } else {
        pasteCopiedItem(this.copiedItem, this.myData)
        this.save(this.copiedItem)
      }

      function pasteCopiedItem (item, data) {
        const oldId = item.id
        item.timeStamp = new Date().toISOString()
        data.push(item)
        const items = data.filter((i) => i.parentId === oldId)
        items.forEach((i) => {
          const child = { ...i }
          child.parentId = item.id
          pasteCopiedItem(child, data)
        })
      }
    },
    editFormKeydown (e) {
      if (e.code === 'Enter') {
        this.save(this.editedItem)
      }
    },
    save (item) {
      if (item.toCloud && (this.userName === '' || !this.userName || this.userName === 'null')) {
        alert('Bitte deinen Benutzernamen eingeben.')
      } else {
        if (item.name && item.name.trim()) {
          item.name = item.name.trim()
        }
        item.value = this.numberUs(item.value)
        item.timeStamp = new Date().toISOString()
        if (!item.id || this.cutedItem) {
        // Position (Reihenfolge) ermitteln
          if (this.currentItems().length === 0) {
            item.pos = 1
          } else {
            item.pos = this.currentItems()[this.currentItems().length - 1].pos + 1
          }
        }
        if (!item.id) {
          item.id = createUUID()
        }
        this.setItemToMyData(item, true)

        if (item.toCloud) {
          const oldItem = this.cloudItems.find(i => item.id === i.id)
          if (oldItem) {
            firebase
              .firestore()
              .collection('archive')
              .add(oldItem)
          }

          const cloudItem = { ...item }
          delete cloudItem.toCloud
          delete cloudItem.id
          cloudItem.user = this.userName.trim()
          if (this.sendNotification) {
            cloudItem.sendNotification = true
          }

          firebase
            .firestore()
            .collection('data')
            .doc(item.id)
            .set(cloudItem)
        }

        this.storeData()

        this.editedItem = null
        this.cutedItem = null
        this.copiedItem = null
      }
    },
    storeData () {
      localStorage.setItem('myinfo24-data', JSON.stringify(this.myData))
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
        filename = 'myinfo24-' + this.currentItem.name + '.json'
      } else {
        text = JSON.stringify(this.myData)
        filename = 'myinfo24.json'
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
    setCloudItemToMydata (cloudItem) {
      this.itemTreeToMyData(cloudItem)

      // Beim Einfügen aus der Cloud die Oberpunkte dazu nehmen
      let item = { ...cloudItem }
      while (item.parentId) {
        item = this.cloudItems.find((i) => i.id === item.parentId)
        this.setItemToMyData(item)
      }
    },
    onPickFile () {
      this.$refs.fileInput.click()
    },
    getUploadetData (event) {
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
          thisHelp.setItemToMyData(item, false)

          localStorage.setItem('myinfo24-data', JSON.stringify(thisHelp.myData))
          window.location.reload()
        })
      }
    },
    setItemToMyData (item, fromSave) {
      delete item.unread
      const foundItem = this.myData.find((i) => i.id === item.id)
      if (!foundItem) {
        if (!fromSave) {
          if (item.user && item.user !== this.userName) {
            setUnreadAndNotification()
          }
        }
        this.myData.push(item)
      } else {
        if (fromSave || (foundItem.timeStamp && this.getDate(foundItem.timeStamp) < this.getDate(item.timeStamp))) {
          if (!fromSave) {
            if (item.user && item.user !== this.userName) {
              setUnreadAndNotification()
            }
          }
          Object.assign(foundItem, item)
        }
      }
      if (item.unread) {
        this.pathArray(item).forEach((i) => {
          i.unread = true
        })
      }

      function setUnreadAndNotification () {
        item.unread = true
        if (item.sendNotification) {
          this.displayNotification(item.user + ': ' + this.showItem(item))
        }
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
    },
    resetSelectedItem () {
      const id = this.selectedItem.id
      this.selectedItem = null
      this.selectedItem = this.myData.find((i) => i.id === id)
    },
    newItemNameKeydown (e) {
      if (e.code === 'Enter') {
        this.saveNewItemName()
      }
    },
    getDate (dateOrTimestamp) {
      if (dateOrTimestamp) {
        if (dateOrTimestamp instanceof Date) {
          return dateOrTimestamp
        } else {
          if (dateOrTimestamp.seconds) {
            return new Date(dateOrTimestamp.seconds * 1000)
          } else {
            return new Date(dateOrTimestamp)
          }
        }
      } else {
        return new Date(0)
      }
    }
  }
}

function createUUID () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0; var v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

</script>
