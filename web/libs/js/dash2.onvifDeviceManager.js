$(document).ready(function(){
    var loadedVideoEncoders = {}
    var blockWindow = $('#onvifDeviceManager')
    var blockWindowInfo = $('#onvifDeviceManagerInfo')
    var blockForm = blockWindow.find('form')
    var converObjectKeysToFormFieldName = (object,parentKey) => {
        parentKey = parentKey ? parentKey : ''
        var theList = {}
        Object.keys(object).forEach((key) => {
            var value = object[key]
            var newKey = parentKey ? parentKey + ':' + key : key
            if(typeof value === 'string'){
                theList[newKey] = value
            }else if(value instanceof Object || value instanceof Array){
                theList = Object.assign(theList,converObjectKeysToFormFieldName(value,newKey))
            }
        })
        return theList
    }
    var writeOnvifDataToFormFields = function(onvifData){
        var formFields = {}
        if(onvifData.networkInterface){
            var ipConfig = onvifData.networkInterface.IPv4.Config
            console.log(ipConfig.LinkLocal)
            var ipv4 = ipConfig.DHCP === 'true' ? ipConfig.LinkLocal.Address : ipConfig.Manual.Address || ipConfig.LinkLocal.Address
            formFields["setNetworkInterface:ipv4"] = ipv4
        }
        if(onvifData.gateway){
            formFields["setGateway:ipv4"] = onvifData.gateway
        }
        if(onvifData.hostname){
            formFields["setHostname:name"] = onvifData.hostname
        }
        if(onvifData.dns && onvifData.dns.DNSManual){
            var dnsList = onvifData.dns.DNSManual.map((item) => {
                return item.IPv4Address
            }).join(',')
            formFields["setDNS:dns"] = dnsList
        }
        if(onvifData.ntp && onvifData.ntp.NTPManual){
            var ntpIp = onvifData.ntp.NTPManual.IPv4Address
            formFields["setNTP:ipv4"] = ntpIp
        }
        if(onvifData.protocols){
            onvifData.protocols.forEach((protocol) => {
                //RTSP, HTTP
                formFields[`setPotocols:${protocol.Name}`] = protocol.Port
            })
        }
        if(onvifData.videoEncoders){
            loadedVideoEncoders = {}
            var html = ``
            onvifData.videoEncoders.forEach((encoder) => {
                html += `<option value="${encoder.$.token}">${encoder.Name}</option>`
                loadedVideoEncoders[encoder.$.token] = encoder
            })
            blockForm.find('[name=videoToken]').html(html)
            setFieldsFromOnvifKeys(onvifData.videoEncoders[0])
        }
        if(onvifData.imagingSettings && onvifData.imagingSettings.ok !== false){
            setFieldsFromOnvifKeys(onvifData.imagingSettings)
        }
        Object.keys(formFields).forEach((key) => {
            var value = formFields[key]
            blockForm.find(`[name="${key}"]`).val(value)
        })
    }
    var setFieldsFromOnvifKeys = function(encoder){
        var formFields = converObjectKeysToFormFieldName(encoder)
        Object.keys(formFields).forEach((key) => {
            var value = formFields[key]
            blockForm.find(`[name="${key}"]`).val(value)
        })
    }
    var getUIFieldValues = function(monitorId){
        $.get($.ccio.init('location',$user)+$user.auth_token+'/onvifDeviceManager/'+$user.ke + '/' + monitorId,function(response){
            var onvifData = response.onvifData
            console.log(response)
            blockWindowInfo.html(JSON.stringify(onvifData,null,3))
            writeOnvifDataToFormFields(onvifData)
            blockWindow.modal('show')
        })
    }
    $('body').on('click','[open-onvif-device-manager]',function(){
        var monitorId = $(this).attr('open-onvif-device-manager')
        getUIFieldValues(monitorId)
    })
    blockForm.on('change','[name="videoToken"]',function(){
        selectVideoEncoder(loadedVideoEncoders[$(this).val()])
    })
    blockForm.submit(function(e){
        e.preventDefault()
        var formOptions = blockForm.serializeObject()
        console.log(formOptions)
        return false;
    })
})
